const FeatureToggleRouter = require("./feature_toggle_router");
const openpgp = require("openpgp");
const lodash = require("lodash");

const PF_PREFIX_S = "ZW-S-";

/**
 * The feature toggle manager allows to load feature configurations and
 * get the values and metadata of the features as well as
 * creating signed and encrypted configurations.
 */
class FeatureToggleManager extends FeatureToggleRouter {
	/**
     * The feature toggle manager can be instantiated to allow multiple instances.
     * E.g.:
     * - To use as a real feature toggle router for the Marketing Console features.
     * - To validate/emulate feature configuration files that are edited in the Marketing Console.
     * - To emulate the result of loading multiple levels of feature configuration files.
	 *
	 * @param {string} [deployment=undefined] The deployment for this feature toggle router.
	 * @param {boolean} debugInfoEnabled Whether debug info should be stored or not.
	 */
	constructor(deployment = undefined, debugInfoEnabled = false) {
		super(deployment, debugInfoEnabled);

		this.signaturePrivateKey2 = undefined;
		this.signaturePrivateKey = undefined;
		this.signaturePassPhrase = undefined;

		this.encryptionPublicKey2 = undefined;
		this.encryptionPublicKey = undefined;
	}

	/**
	 * Retrieves the private key used for signature (for creating the signature).
	 *
	 * @returns {string} The private key.
	 */
	getSignaturePrivateKey() {
		return this.signaturePrivateKey;
	}

	/**
	 * Retrieves the pass phrase used for signature.
	 *
	 * @returns {string} The pass phrase.
	 */
	getSignaturePassPhrase() {
		return this.signaturePassPhrase;
	}

	/**
	 * Sets the private key and pass phrase used signature (for creating the signature).
	 *
	 * @async
	 * @param {string} privateKey The private key.
	 * @param {string} passPhrase The pass phrase.
	 */
	async setSignaturePrivateKey(privateKey, passPhrase) {
		this.validatePassPhrase(passPhrase, "signature");

		this.signaturePrivateKey2 = await openpgp.decryptKey({
			privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
			passphrase: PF_PREFIX_S + passPhrase
		});

		this.signaturePrivateKey = privateKey;
		this.signaturePassPhrase = passPhrase;
	}

	/**
	 * Retrieves the public key used for encryption (for encrypting a configuration).
	 *
	 * @returns {string} The public key.
	 */
	getEncryptionPublicKey() {
		return this.encryptionPublicKey;
	}

	/**
	 * Sets the public key used for encryption (for encrypting a configuration).
	 *
	 * @async
	 * @param {string} publicKey The public key.
	 */
	async setEncryptionPublicKey(publicKey) {
		this.encryptionPublicKey2 = await openpgp.readKey({ armoredKey: publicKey });

		this.encryptionPublicKey = publicKey;
	}

	/**
	 * Signs a configuration.
	 *
	 * IMPORTANT NOTICE: The deployment, signature private key and signature pass phrase need to be set.
	 *
	 * @async
	 * @param {string} configuration The configuration.
	 * @returns (object) The signed configuration (with a signature).
	 * @throws {Error} If deployment, signature private key or signature pass phrase is not set.
	 */
	async sign(configuration) {
		// Validate if all properties for signing are configured.
		if (this.deployment === undefined) {
			throw new Error("The deployment needs to be set before signing a configuration.");
		}
		if (this.signaturePrivateKey2 === undefined) {
			throw new Error("The signature private key and signature pass phrase need to be set before signing a configuration.");
		}

		const signedConfiguration = lodash.cloneDeep(configuration);

		// Add the deployment value if not specified. Otherwise check if it is the same.
		if (signedConfiguration.ftrDeployment === undefined) {
			signedConfiguration.ftrDeployment = this.deployment;
		} else if (signedConfiguration.ftrDeployment !== this.deployment) {
			throw new Error("The configuration to sign already contains a value for 'ftrDeployment', but it is different from this feature toggle router's deployment.");
		}

		// Create the signature.
		const message = await openpgp.createMessage({ text: JSON.stringify(signedConfiguration) });
		let detachedSignature = await openpgp.sign({
			message,
			signingKeys: this.signaturePrivateKey2,
			detached: true
		});

		// Remove all OpenPGP formatting.
		// Remove the prefix and suffix.
		detachedSignature = detachedSignature.replace(/-----.*-----/g, "");
		// Remove the leading and trailing newlines.
		detachedSignature = detachedSignature.trim();
		// Remove the inner newlines.
		detachedSignature = detachedSignature.replace(/\n/g, "-");

		// Set the signature.
		signedConfiguration.ftrSignature = detachedSignature;

		return signedConfiguration;
	}

	/**
	 * Encrypts a configuration.
	 * It also signs the configuration if it is not already signed.
	 *
	 * IMPORTANT NOTICE: The deployment and encryption public key need to be set.
	 *
	 * @async
	 * @param {string} configuration The configuration.
	 * @returns (object) The signed configuration (with a signature).
	 * @throws {Error} If deployment, signaturePassPhrase or signaturePrivateKey is not set.
	 */
	async encrypt(configuration) {
		// Validate if all properties for encrypting are configured.
		if (this.deployment === undefined) {
			throw new Error("The deployment needs to be set before encrypting a configuration.");
		}
		if (this.encryptionPublicKey2 === undefined) {
			throw new Error("The encryption public key needs to be set before encrypting a configuration.");
		}

		// Check if the configuration is signed and sign it if not.
		let signedConfiguration;
		if (await this.isSigned(configuration)) {
			signedConfiguration = lodash.cloneDeep(configuration);
		} else {
			signedConfiguration = await this.sign(configuration);
		}

		// Encrypt the configuration into a license string.
		const encryption = await openpgp.encrypt({
			message: await openpgp.createMessage({ text: JSON.stringify(signedConfiguration) }),
			encryptionKeys: this.encryptionPublicKey2
		});

		// Remove all OpenPGP formatting.
		// Remove the prefix and suffix.
		let ftrLicense = encryption.replace(/-----.*-----/g, "");
		// Remove the leading and trailing newlines.
		ftrLicense = ftrLicense.trim();
		// Remove the inner newlines.
		ftrLicense = ftrLicense.replace(/\n/g, "-");

		// Create the licensed configuration containing only the license key.
		const licensedConfiguration = {
			ftrLicense: ftrLicense
		};

		return licensedConfiguration;
	}

	/**
	 * Generates a keypair for configuration signature.
	 *
	 * @async
	 * @param {string} passphrase The pass phrase.
	 * @throws {Error} If passphrase is not a non-empty string.
	 */
	async generateSignatureKeyPair(passPhrase) {
		this.validatePassPhrase(passPhrase, "signature");

		const signatureKeyPair = await openpgp.generateKey({
			type: "rsa",
			rsaBits: 4096,
			userIDs: [{ name: "Zappware", email: "info@zappware.com" }],
			passphrase: PF_PREFIX_S + passPhrase
		});

		return {
			privateKey: signatureKeyPair.privateKey,
			publicKey: signatureKeyPair.publicKey
		};
	}

	/**
	 * Generates a keypair for configuration encryption.
	 *
	 * @async
	 * @param {string} passphrase The pass phrase.
	 * @throws {Error} If passphrase is not a non-empty string.
	 */
	async generateEncryptionKeyPair(passPhrase) {
		this.validatePassPhrase(passPhrase, "encryption");

		const encryptionKeyPair = await openpgp.generateKey({
			type: "rsa",
			rsaBits: 4096,
			userIDs: [{ name: "Zappware", email: "info@zappware.com" }],
			passphrase: FeatureToggleRouter.PF_PREFIX_E + passPhrase
		});

		return {
			privateKey: encryptionKeyPair.privateKey,
			publicKey: encryptionKeyPair.publicKey
		};
	}
}

module.exports = FeatureToggleManager;
