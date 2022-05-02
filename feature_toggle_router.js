const SharedUtilities = require("./shared_utilities");
const openpgp = require("openpgp");
const lodash = require("lodash");

const PF_PREFIX_E = "ZW-E-";

/**
 * The feature toggle router allows to load feature configurations and
 * get the values and metadata of the features.
 */
class FeatureToggleRouter {
  /**
   * @protected
   */
  static get PF_PREFIX_E() {
    return PF_PREFIX_E;
  }

  /**
   * The feature toggle router can be instantiated to allow multiple instances.
   * E.g.:
   * - To use as a real feature toggle router for the Marketing Console features.
   * - To validate/emulate feature configuration files that are edited in the Marketing Console.
   * - To emulate the result of loading multiple levels of feature configuration files.
   *
   * @param {string} [deployment=undefined] The deployment for this feature toggle router.
   * @param {boolean} debugInfoEnabled Whether debug info should be stored or not.
   */
  constructor(deployment = undefined, debugInfoEnabled = false) {
    this.activeConfiguration = {};
    this.configurationStatuses = [];

    if (deployment !== undefined) {
      this.setDeployment(deployment);
    } else {
      this.deployment = undefined;
    }

    this.debugInfoEnabled = debugInfoEnabled;

    this.signaturePublicKey2 = undefined;
    this.signaturePublicKey = undefined;

    this.encryptionPrivateKey2 = undefined;
    this.encryptionPrivateKey = undefined;
    this.encryptionPassPhrase = undefined;
  }

  /**
   * Validates a pass phrase to be a non-empty string.
   *
   * @private
   * @param {string} passPhrase The pass phrase.
   * @returns {boolean} true if the pass phrase is valid.
   * @throws {Error} If the pass phrase is not valid.
   */
  validatePassPhrase(passPhrase, description = undefined) {
    if (typeof passPhrase !== "string" || passPhrase.trim() === "") {
      throw new Error(
        `Pass phrase ${
          description ? `for ${description}` : ""
        } needs to be a non-empty string.`
      );
    }

    return true;
  }

  /**
   * Retrieves the deployment of this feature toggle router.
   *
   * @returns {string} The deployment.
   */
  getDeployment() {
    return this.deployment;
  }

  /**
   * Sets the deployment for this feature toggle router.
   *
   * IMPORTANT NOTICE: Be aware that this does not re-validate already loaded configurations!
   *
   * @param {string} deployment The deployment.
   * @throws {Error} If the deployment is not a non-empty string.
   */
  setDeployment(deployment) {
    if (typeof deployment !== "string" || deployment.trim() === "") {
      throw new Error("If set, deployment needs to be a non-empty string.");
    }

    this.deployment = deployment;
  }

  /**
   * Retrieves the public key used for signature (for validating the signature).
   *
   * @returns {string} The public key.
   */
  getSignaturePublicKey() {
    return this.signaturePublicKey;
  }

  /**
   * Sets the public key used for signature (for validating the signature).
   *
   * @async
   * @param {string} publicKey The public key.
   */
  async setSignaturePublicKey(publicKey) {
    this.signaturePublicKey2 = await openpgp.readKey({ armoredKey: publicKey });

    this.signaturePublicKey = publicKey;
  }

  /**
   * Retrieves the private key used for encryption (for decrypting a configuration).
   *
   * @returns {string} The public key.
   */
  getEncryptionPrivateKey() {
    return this.encryptionPrivateKey;
  }

  /**
   * Retrieves the pass phrase used for encryption.
   *
   * @returns {string} The pass phrase.
   */
  getEncryptionPassPhrase() {
    return this.encryptionPassPhrase;
  }

  /**
   * Sets the private key and pass phrase used for encryption (for decrypting a configuration).
   *
   * @async
   * @param {string} privateKey The private key.
   * @param {string} passPhrase The pass phrase.
   */
  async setEncryptionPrivateKey(privateKey, passPhrase) {
    this.validatePassPhrase(passPhrase, "encryption");

    this.encryptionPrivateKey2 = await openpgp.decryptKey({
      privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
      passphrase: PF_PREFIX_E + passPhrase,
    });

    this.encryptionPrivateKey = privateKey;
    this.encryptionPassPhrase = passPhrase;
  }

  /**
   * Retrieves the full metadata object of a feature for the active configuration.
   *
   * @param {string} featureName The name of the feature.
   * @param {Object} [configuration=activeConfiguration] The configuration.
   * @returns {Object} The full metadata object.
   */
  getFeatureMetadata(featureName, configuration = this.activeConfiguration) {
    // Traverse into the tree, if applicable.
    let parentConfiguration = configuration;
    let remainingPath = featureName;
    let pathSeparatorIndex = remainingPath.indexOf(".");
    while (pathSeparatorIndex >= 0) {
      const parentName = remainingPath.substring(0, pathSeparatorIndex);
      if (
        Object.prototype.hasOwnProperty.call(parentConfiguration, parentName)
      ) {
        parentConfiguration = parentConfiguration[parentName];

        remainingPath = remainingPath.substring(pathSeparatorIndex + 1);
        pathSeparatorIndex = remainingPath.indexOf(".");
      } else {
        return undefined;
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(parentConfiguration, remainingPath)
    ) {
      const feature = parentConfiguration[remainingPath];

      // Compose the feature metadata.
      let featureMetadata;
      if (typeof feature !== "object") {
        featureMetadata = {
          ftrValue: feature,
        };
      } else {
        featureMetadata = feature;
      }

      // Get the feature metadata from the configuration.
      return featureMetadata;
    }

    return undefined;
  }

  /**
   * Retrieves the value (ftrValue) of a feature for the configuration.
   *
   * @param {string} featureName The name of the feature.
   * @param {*} defaultValue The value to return if there is no value specified for the feature.
   * @param {Object} [configuration=activeConfiguration] The configuration.
   * @returns {*} The value of the feature.
   */
  getValue(
    featureName,
    defaultValue = undefined,
    configuration = this.activeConfiguration
  ) {
    const featureMetadata = this.getFeatureMetadata(featureName, configuration);
    if (featureMetadata !== undefined) {
      if (Object.prototype.hasOwnProperty.call(featureMetadata, "ftrValue")) {
        return featureMetadata.ftrValue;
      }
    }

    return defaultValue;
  }

  /**
   * Retrieves the locked state (ftrLocked) of a feature for the configuration.
   *
   * @param {string} featureName The name of the feature.
   * @param {Object} [configuration=activeConfiguration] The configuration.
   * @returns (boolean) The locked state of the feature.
   */
  isLocked(featureName, configuration = this.activeConfiguration) {
    const featureMetadata = this.getFeatureMetadata(featureName, configuration);
    if (featureMetadata !== undefined) {
      if (Object.prototype.hasOwnProperty.call(featureMetadata, "ftrLocked")) {
        return featureMetadata.ftrLocked;
      }
    }

    return false;
  }

  /**
   * Retrieves the title (ftrTitle) of a feature for the configuration.
   *
   * IMPORTANT NOTE: The title of a feature can also be defined in the AppLoc resource bundle and has precedence.
   * The feature name (e.g. "featureParentName.featureName") suffixed by ".title" is the AppLoc key
   * (e.g. "featureParentName.featureName.title").
   *
   * @param {string} featureName The name of the feature.
   * @param {*} defaultValue The value to return if there is no value specified for the feature.
   * @param {Object} [configuration=activeConfiguration] The configuration.
   * @returns {Object} The title of the feature.
   */
  getTitle(
    featureName,
    defaultValue = undefined,
    configuration = this.activeConfiguration
  ) {
    const featureMetadata = this.getFeatureMetadata(featureName, configuration);
    if (featureMetadata !== undefined) {
      if (Object.prototype.hasOwnProperty.call(featureMetadata, "ftrTitle")) {
        return featureMetadata.ftrTitle;
      }
    }

    return defaultValue;
  }

  /**
   * Retrieves the description (ftrDescription) of a feature for the configuration.
   *
   * IMPORTANT NOTE: The description of a feature can also be defined in the AppLoc resource bundle and has precedence.
   * The feature name (e.g. "featureParentName.featureName"), suffixed by ".description" is the AppLoc key
   * (e.g. "featureParentName.featureName.description").
   *
   * @param {string} featureName The name of the feature.
   * @param {*} defaultValue The value to return if there is no value specified for the feature.
   * @param {Object} [configuration=activeConfiguration] The configuration.
   * @returns {Object} The title of the feature.
   */
  getDescription(
    featureName,
    defaultValue = undefined,
    configuration = this.activeConfiguration
  ) {
    const featureMetadata = this.getFeatureMetadata(featureName, configuration);
    if (featureMetadata !== undefined) {
      if (
        Object.prototype.hasOwnProperty.call(featureMetadata, "ftrDescription")
      ) {
        return featureMetadata.ftrDescription;
      }
    }

    return defaultValue;
  }

  /**
   * Checks if a configuration is encrypted (has a valid ftrLicense).
   * It also checks if the decrypted configuration is signed (has a valid ftrSignature).
   *
   * IMPORTANT NOTICE: The deployment, encryption private key and encryption pass phrase need to be set.
   *
   * @async
   * @param {Object} configuration The configuration.
   * @returns {(false|Object)} The decrypted configuration or false if not encrypted and correctly signed.
   */
  async isEncrypted(configuration) {
    if (Object.prototype.hasOwnProperty.call(configuration, "ftrLicense")) {
      // Validate if all properties for decrypting are configured.
      // IMPORTANT: These properties only need to be set if the configuration is licensed, thus if ftrLicense is set!
      if (this.deployment === undefined) {
        throw new Error(
          "The deployment needs to be set before decrypting a configuration."
        );
      }
      if (this.encryptionPrivateKey2 === undefined) {
        throw new Error(
          "The encryption private key and encryption pass phrase need to be set before decrypting a configuration."
        );
      }

      // The configuration is encrypted. Check the encryption and the signature.
      const ftrLicense = configuration.ftrLicense;

      // Re-add the OpenPGP formatting.
      // Re-add the inner newlines.
      let encryption = ftrLicense.replace(/-/g, "\n");
      // Re-add the prefix and suffix with the newlines.
      encryption = `-----BEGIN PGP MESSAGE-----\n\n${encryption}\n\n-----END PGP MESSAGE-----`;

      // Decrypt the feature license and check the signature and use that content as configuration.
      const message = await openpgp.readMessage({
        armoredMessage: encryption,
      });
      const { data: decrypted } = await openpgp.decrypt({
        message,
        decryptionKeys: this.encryptionPrivateKey2,
      });
      const decryptedConfiguration = JSON.parse(decrypted);

      // An encrypted configuration also needs to be signed.
      if (await this.isSigned(decryptedConfiguration)) {
        return decryptedConfiguration;
      }
    }

    return false;
  }

  /**
   * Checks if a configuration is signed (has a valid ftrSignature).
   *
   * IMPORTANT NOTICE: The deployment and signature public key need to be set.
   *
   * @async
   * @param {Object} configuration The configuration.
   * @returns {boolean} Whether the configuration is signed.
   */
  async isSigned(configuration) {
    if (Object.prototype.hasOwnProperty.call(configuration, "ftrSignature")) {
      // Validate if all properties for checking the signature are configured.
      // IMPORTANT: These properties only need to be set if the configuration is signed, thus if ftrSignature is set!
      if (this.deployment === undefined) {
        throw new Error(
          "The deployment needs to be set before checking the signature of a configuration."
        );
      }
      if (this.signaturePublicKey2 === undefined) {
        throw new Error(
          "The signature public key needs to be set before checking the signature of a configuration."
        );
      }

      // The configuration is signed. Check the signature.
      const ftrSignature = configuration.ftrSignature;
      if (
        Object.prototype.hasOwnProperty.call(configuration, "ftrDeployment")
      ) {
        // Check the ftrDeployment value of the configuration against the value of this feature toggle router.
        const ftrDeployment = configuration.ftrDeployment;
        if (ftrDeployment != this.deployment) {
          throw new Error(
            `Configuration contains the wrong ftrDeployment value: '${ftrDeployment}' instead of required '${this.deployment}'.`
          );
        }

        // Check the configuration against its signature.
        // Re-add the OpenPGP formatting.
        // Re-add the inner newlines.
        let detachedSignature = ftrSignature.replace(/-/g, "\n");
        // Re-add the prefix and suffix with the newlines.
        detachedSignature = `-----BEGIN PGP SIGNATURE-----\n\n${detachedSignature}\n\n-----END PGP SIGNATURE-----`;
        const signature = await openpgp.readSignature({
          armoredSignature: detachedSignature,
        });

        // Remove the signature from the configuration to get the configuration to check.
        const unsignedConfiguration = lodash.cloneDeep(configuration);
        delete unsignedConfiguration.ftrSignature;

        // Check the unsigned configuration against the signature.
        const message = await openpgp.createMessage({
          text: JSON.stringify(unsignedConfiguration),
        });
        const verificationResult = await openpgp.verify({
          message,
          signature,
          verificationKeys: this.signaturePublicKey2,
        });
        const { verified } = verificationResult.signatures[0];
        try {
          await verified; // Throws on invalid signature, otherwise continues.
        } catch (error) {
          throw new Error(`Signature could not be verified: ${error.message}`);
        }
        return true;
      } else {
        // There's a signature, but not deployment value, so invalid.
        throw new Error(
          "Configuration contains a ftrSignature but no ftrDeployment."
        );
      }
    }

    return false;
  }

  /**
   * Checks if a configuration is licensed (has a valid ftrLicense or ftrSignature).
   *
   * @async
   * @param {Object} configuration The configuration.
   * @returns {boolean} Whether the configuration is licensed.
   */
  async isLicensed(configuration) {
    return (
      (await this.isEncrypted(configuration)) !== false ||
      (await this.isSigned(configuration))
    );
  }

  /**
   * Loads a configuration into the active configuration of the feature toggle router.
   *
   * @async
   * @param {string} source The source for the configuration.
   * @param {Object} configuration The configuration.
   * @returns {Object} The configuration status.
   */
  async loadConfiguration(source, configuration) {
    const configurationStatus = {
      modified: SharedUtilities.getFormattedUTCDateString(new Date()),
      source: source,
      configuration: configuration,
    };

    try {
      const decryptedConfiguration = await this.isEncrypted(configuration);
      let isLicensed;
      let configurationToParse;
      if (decryptedConfiguration !== false) {
        isLicensed = true;
        configurationToParse = decryptedConfiguration;
      } else {
        isLicensed = await this.isSigned(configuration);
        configurationToParse = configuration;
      }

      await this.loadFeature(
        source,
        configurationToParse,
        this.activeConfiguration,
        configurationStatus,
        isLicensed
      );

      configurationStatus.loaded = true;
    } catch (error) {
      // TODO: If a configuration is not entirely loaded, it's probably better to revert to the previous activeConfiguration. Or do we need to continue parsing and make a list of errors that occurred.
      configurationStatus.loaded = false;
      configurationStatus.error = error.message;
    }

    // Add the configuration status to the list of loaded configurations.
    this.configurationStatuses.push(configurationStatus);

    return configurationStatus;
  }

  /**
   * Private helper function to load all child features of a specific feature.
   *
   * @private
   * @async
   * @param {string} source The source for the configuration.
   * @param {Object} parentFeature The parent feature to load all child features from.
   * @param {Object} activeParentFeature The parent feature to save all child features into.
   * @param {Object} configurationStatus The configuration status.
   * @param {boolean} isLicensed Whether the configuration is licensed.
   */
  async loadFeature(
    source,
    parentFeature,
    activeParentFeature,
    configurationStatus,
    isLicensed
  ) {
    for (const [featureName, feature] of Object.entries(parentFeature)) {
      // Skip special fields starting with "ftr".
      if (featureName.startsWith("ftr")) {
        continue;
      }

      // Compose the feature metadata.
      let newFeatureMetadata;
      if (typeof feature !== "object") {
        newFeatureMetadata = {
          ftrValue: feature,
        };
      } else {
        newFeatureMetadata = feature;
      }

      // If the feature does not exist yet in the active configuration, add it.
      if (
        !Object.prototype.hasOwnProperty.call(activeParentFeature, featureName)
      ) {
        activeParentFeature[featureName] = {};
      }

      // Get the feature from the active configuration.
      const activeFeature = activeParentFeature[featureName];

      // Check if the active feature is locked.
      const ftrLocked =
        Object.prototype.hasOwnProperty.call(activeFeature, "ftrLocked") &&
        activeFeature.ftrLocked == true;

      const ftrLockedValues = activeFeature.ftrLockedValues;

      // Update feature locked values (ftrLockedValues), if it is specified.
      if (
        Object.prototype.hasOwnProperty.call(
          newFeatureMetadata,
          "ftrLockedValues"
        )
      ) {
        // Get the actual value (ftrValue) from the feature metadata.
        const newFtrLockedValues = newFeatureMetadata.ftrLockedValues;

        // TODO: It should not be allowed to be set if not yet locked or set to locked in the same configuration, to avoid lowering the locked values, but maybe this is OK because of the isSubset.
        // Updating the locked values is only allowed if not locked or from a signed configuration or when setting it to an subset of the current locked values.
        if (
          !ftrLocked ||
          isLicensed ||
          (Array.isArray(ftrLockedValues) &&
            SharedUtilities.isSubset(ftrLockedValues, newFtrLockedValues))
        ) {
          activeFeature.ftrLockedValues = newFtrLockedValues;
          if (this.debugInfoEnabled) {
            activeFeature.ftrLockedValuesInfo = {
              source: source,
              modified: configurationStatus.modified,
            };
          }
        }
      }

      // Update feature value (ftrValue), if it is specified.
      if (
        Object.prototype.hasOwnProperty.call(newFeatureMetadata, "ftrValue")
      ) {
        // Get the actual value (ftrValue) from the feature metadata.
        const newFtrValue = newFeatureMetadata.ftrValue;

        // Updating the value is only allowed if not locked or from a signed configuration or when setting it to one of the allowed locked values.
        if (
          !ftrLocked ||
          isLicensed ||
          (Array.isArray(ftrLockedValues) &&
            ftrLockedValues.includes(newFtrValue))
        ) {
          activeFeature.ftrValue = newFtrValue;

          if (this.debugInfoEnabled) {
            activeFeature.ftrValueInfo = {
              source: source,
              modified: configurationStatus.modified,
            };
          }
        }
      }

      // Update the type (ftrType), if it is specified.
      if (Object.prototype.hasOwnProperty.call(newFeatureMetadata, "ftrType")) {
        const newFtrType = newFeatureMetadata.ftrType;

        activeFeature.ftrType = newFtrType;

        if (this.debugInfoEnabled) {
          activeFeature.ftrTypeInfo = {
            source: source,
            modified: configurationStatus.modified,
          };
        }
      }

      // Update the range (ftrRange), if it is specified.
      if (
        Object.prototype.hasOwnProperty.call(newFeatureMetadata, "ftrRange")
      ) {
        const newFtrRange = newFeatureMetadata.ftrRange;

        activeFeature.ftrRange = newFtrRange;

        if (this.debugInfoEnabled) {
          activeFeature.ftrRangeInfo = {
            source: source,
            modified: configurationStatus.modified,
          };
        }
      }

      // Update the validation regex (ftrOptInValues), if it is specified.
      if (
        Object.prototype.hasOwnProperty.call(
          newFeatureMetadata,
          "ftrValidationRegex"
        )
      ) {
        const newFtrValidationRegex = newFeatureMetadata.ftrValidationRegex;

        activeFeature.ftrValidationRegex = newFtrValidationRegex;

        if (this.debugInfoEnabled) {
          activeFeature.ftrValidationRegexInfo = {
            source: source,
            modified: configurationStatus.modified,
          };
        }
      }
      // Update feature title (ftrTitle), if it is specified.
      if (
        Object.prototype.hasOwnProperty.call(newFeatureMetadata, "ftrTitle")
      ) {
        // Get the actual title (ftrTitle) from the feature metadata.
        const newFtrTitle = newFeatureMetadata.ftrTitle;

        activeFeature.ftrTitle = newFtrTitle;

        if (this.debugInfoEnabled) {
          activeFeature.ftrTitleInfo = {
            source: source,
            modified: configurationStatus.modified,
          };
        }
      }

      // Update feature description (ftrDescription), if it is specified.
      if (
        Object.prototype.hasOwnProperty.call(
          newFeatureMetadata,
          "ftrDescription"
        )
      ) {
        // Get the actual description (ftrDescription) from the feature metadata.
        const newFtrDescription = newFeatureMetadata.ftrDescription;

        activeFeature.ftrDescription = newFtrDescription;

        if (this.debugInfoEnabled) {
          activeFeature.ftrDescriptionInfo = {
            source: source,
            modified: configurationStatus.modified,
          };
        }
      }

      // Update the opt-in state (ftrOptInEnabled), if it is specified.
      if (
        Object.prototype.hasOwnProperty.call(
          newFeatureMetadata,
          "ftrOptInEnabled"
        )
      ) {
        const newFtrOptInEnabled = newFeatureMetadata.ftrOptInEnabled;

        activeFeature.ftrOptInEnabled = newFtrOptInEnabled;

        if (this.debugInfoEnabled) {
          activeFeature.ftrOptInEnabledInfo = {
            source: source,
            modified: configurationStatus.modified,
          };
        }
      }

      // Update the opt-in values (ftrOptInValues), if it is specified.
      if (
        Object.prototype.hasOwnProperty.call(
          newFeatureMetadata,
          "ftrOptInValues"
        )
      ) {
        const newFtrOptInValues = newFeatureMetadata.ftrOptInValues;

        activeFeature.ftrOptInValues = newFtrOptInValues;

        if (this.debugInfoEnabled) {
          activeFeature.ftrOptInValuesInfo = {
            source: source,
            modified: configurationStatus.modified,
          };
        }
      }

      // Update the locked state (ftrLocked), if it is specified.
      if (
        Object.prototype.hasOwnProperty.call(newFeatureMetadata, "ftrLocked")
      ) {
        const newFtrLocked = newFeatureMetadata.ftrLocked;
        // Updating the locked state is only allowed if not locked or from a signed configuration or when setting it to true.
        if (!ftrLocked || isLicensed || newFtrLocked == true) {
          activeFeature.ftrLocked = newFtrLocked;
          if (this.debugInfoEnabled) {
            activeFeature.ftrLockedInfo = {
              source: source,
              modified: configurationStatus.modified,
            };
          }
        }
        // TODO: Throw error or log if not allowed?
      }

      if (typeof feature === "object") {
        await this.loadFeature(
          source,
          feature,
          activeFeature,
          configurationStatus,
          isLicensed
        );
      }
    }
  }

  /**
   * Retrieves the entire active configuration.
   *
   * @returns {Object} The active configuration.
   */
  getActiveConfiguration() {
    return this.activeConfiguration;
  }

  /**
   * Retrieves a list of configuration statuses, optionally filtered on source.
   *
   * @param {string} [source] The source to filter on.
   * @returns {Object[]} The list of configuration statuses.
   */
  getConfigurations(source = undefined) {
    if (source != undefined) {
      return this.configurationStatuses.filter((configurationStatus) => {
        return configurationStatus.source == source;
      });
    } else {
      return this.configurationStatuses;
    }
  }

  /**
   * Retrieves a list of configuration statuses that failed to load.
   *
   * @returns {Object[]} The list of configuration statuses.
   */
  getFailedConfigurations() {
    return this.configurationStatuses.filter((configurationStatus) => {
      return !configurationStatus.loaded;
    });
  }

  hasOptIn() {
    return this.hasOptIn;
  }

  getOptInFeatures() {
    // TODO
  }

  /**
   * Builds a configuration containing a feature with the specified feature metadata.
   *
   * @param {*} featureName The name of the feature.
   * @param {*} featureMetadata The metadata for the feature.
   * @returns {Object} The configuration.
   */
  buildConfigurationWithFeature(featureName, featureMetadata) {
    // Build a configuration for setting this feature value.
    const configuration = featureName
      .split(".")
      .reduceRight((previousValue, currentValue) => {
        return {
          [currentValue]: previousValue,
        };
      }, featureMetadata);

    return configuration;
  }

  /**
   * Sets the value for a feature by loading it as an extra configuration.
   *
   * @async
   * @param {string} source The source for the configuration.
   * @param {string} featureName The name of the feature.
   * @param {Object} featureValue The value for the feature.
   */
  async setValue(source, featureName, featureValue) {
    // Build a configuration for setting this feature value.
    const featureMetadata = {
      ftrValue: featureValue,
    };
    const configuration = this.buildConfigurationWithFeature(
      featureName,
      featureMetadata
    );

    // Load the configuration.
    await this.loadConfiguration(source, configuration);
  }

  /**
   * Sets the locked state of a feature by loading it as an extra configuration.
   *
   * @async
   * @param {string} source The source for the configuration.
   * @param {string} featureName The name of the feature.
   * @param {boolean} locked The locked state for the feature.
   */
  async setLocked(source, featureName, locked) {
    if (typeof locked !== "boolean") {
      throw new Error(
        "The locked value should be a boolean 'true' of 'false'."
      );
    }

    // Build a configuration for setting this feature locked state.
    const featureMetadata = {
      ftrLocked: locked,
    };
    const configuration = this.buildConfigurationWithFeature(
      featureName,
      featureMetadata
    );

    // Load the configuration.
    await this.loadConfiguration(source, configuration);
  }
}

module.exports = FeatureToggleRouter;
