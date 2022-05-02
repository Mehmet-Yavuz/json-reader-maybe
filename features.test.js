const FeatureToggleRouter = require("./feature_toggle_router.js");
const FeatureToggleManager = require("./feature_toggle_manager.js");
const lodash = require("lodash");

const TEST_DEPLOYMENT_A = "Deployment A";
const TEST_DEPLOYMENT_B = "Deployment B";

const TEST_CONFIGURATION_WITHOUT_VALUE = Object.freeze({
	featureWithoutValue: {}
});
const TEST_CONFIGURATION_NO_FEATURES = Object.freeze({
	something: true,
	somethingElse: false
});
const TEST_CONFIGURATION_BOOLEAN_SIMPLE = Object.freeze({
	booleanFeatureTrue: true,
	booleanFeatureFalse: false
});
const TEST_CONFIGURATION_BOOLEAN_METADATA = Object.freeze({
	booleanFeatureTrue: {
		ftrValue: true
	},
	booleanFeatureFalse: {
		ftrValue: false
	}
});
const TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED = Object.freeze({
	featureX: {
		ftrValue: "ValueA",
		ftrLocked: true
	}
});
const TEST_CONFIGURATION_FEATURE_X_VALUE_B = Object.freeze({
	featureX: {
		ftrValue: "ValueB"
	}
});
const TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED_VALUES_3_OPTIONS = Object.freeze({
	featureX: {
		ftrLockedValues: ["ValueA", "ValueB", "ValueC"]
	}
});
const TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED_VALUES_2_OPTIONS = Object.freeze({
	featureX: {
		ftrLockedValues: ["ValueA", "ValueB"]
	}
});

let featureToggleRouterA;
// let featureToggleRouterB;

let testSignaturePrivateKeyA;
let testSignaturePassPhraseA;
let testSignaturePublicKeyA;
let testSignaturePrivateKeyB;
let testSignaturePassPhraseB;
let testSignaturePublicKeyB;

let testEncryptionPrivateKeyA;
let testEncryptionPassPhraseA;
let testEncryptionPublicKeyA;
let testEncryptionPrivateKeyB;
let testEncryptionPassPhraseB;
// let testEncryptionPublicKeyB;

beforeAll(async() => {
	const featureToggleManager = new FeatureToggleManager();

	testSignaturePassPhraseA = "Signature Pass Phrase A";
	const signatureKeyPairA = await featureToggleManager.generateSignatureKeyPair(testSignaturePassPhraseA);
	testSignaturePrivateKeyA = signatureKeyPairA.privateKey;
	testSignaturePublicKeyA = signatureKeyPairA.publicKey;

	testSignaturePassPhraseB = "Signature Pass Phrase B";
	const signatureKeyPairB = await featureToggleManager.generateSignatureKeyPair(testSignaturePassPhraseB);
	testSignaturePrivateKeyB = signatureKeyPairB.privateKey;
	testSignaturePublicKeyB = signatureKeyPairB.publicKey;

	testEncryptionPassPhraseA = "Encryption PassPhrase A";
	const encryptionKeyPairA = await featureToggleManager.generateEncryptionKeyPair(testEncryptionPassPhraseA);
	testEncryptionPrivateKeyA = encryptionKeyPairA.privateKey;
	testEncryptionPublicKeyA = encryptionKeyPairA.publicKey;

	testEncryptionPassPhraseB = "Encryption Pass Phrase B";
	const encryptionKeyPairB = await featureToggleManager.generateEncryptionKeyPair(testEncryptionPassPhraseB);
	testEncryptionPrivateKeyB = encryptionKeyPairB.privateKey;
	// testEncryptionPublicKeyB = encryptionKeyPairB.publicKey;
});

beforeEach(async() => {
	featureToggleRouterA = new FeatureToggleManager(TEST_DEPLOYMENT_A);
	await featureToggleRouterA.setSignaturePrivateKey(testSignaturePrivateKeyA, testSignaturePassPhraseA);
	await featureToggleRouterA.setSignaturePublicKey(testSignaturePublicKeyA);
	await featureToggleRouterA.setEncryptionPrivateKey(testEncryptionPrivateKeyA, testEncryptionPassPhraseA);
	await featureToggleRouterA.setEncryptionPublicKey(testEncryptionPublicKeyA);

	featureToggleRouterB = new FeatureToggleManager(TEST_DEPLOYMENT_B);
});

test("FeatureToggleManager should be instantiated", () => {
	expect(() => {
		// eslint-disable-next-line no-new
		new FeatureToggleManager();
		// eslint-disable-next-line no-new
		new FeatureToggleManager(undefined, true);
		// eslint-disable-next-line no-new
		new FeatureToggleManager(TEST_DEPLOYMENT_A);
		// eslint-disable-next-line no-new
		new FeatureToggleManager(TEST_DEPLOYMENT_A, true);
	}).not.toThrow();
});

test("FeatureToggleRouter should be instantiated", () => {
	expect(() => {
		// eslint-disable-next-line no-new
		new FeatureToggleRouter();
		// eslint-disable-next-line no-new
		new FeatureToggleRouter(undefined, true);
		// eslint-disable-next-line no-new
		new FeatureToggleRouter(TEST_DEPLOYMENT_A);
		// eslint-disable-next-line no-new
		new FeatureToggleRouter(TEST_DEPLOYMENT_A, true);
	}).not.toThrow();
});

test("Instantiating deployment to an invalid value should throw", () => {
	// For FeatureToggleManager.
	expect(() => {
		// eslint-disable-next-line no-new
		new FeatureToggleManager(null);
	}).toThrow();
	expect(() => {
		// eslint-disable-next-line no-new
		new FeatureToggleManager(123);
	}).toThrow();
	expect(() => {
		// eslint-disable-next-line no-new
		new FeatureToggleManager("");
	}).toThrow();
	expect(() => {
		// eslint-disable-next-line no-new
		new FeatureToggleManager(" ");
	}).toThrow();

	// For FeatureToggleRouter.
	expect(() => {
		// eslint-disable-next-line no-new
		new FeatureToggleRouter(null);
	}).toThrow();
	expect(() => {
		// eslint-disable-next-line no-new
		new FeatureToggleRouter(123);
	}).toThrow();
	expect(() => {
		// eslint-disable-next-line no-new
		new FeatureToggleRouter("");
	}).toThrow();
	expect(() => {
		// eslint-disable-next-line no-new
		new FeatureToggleRouter(" ");
	}).toThrow();
});

test("Setting deployment to an invalid value should throw", () => {
	// For FeatureToggleManager.
	const featureToggleManager = new FeatureToggleManager();
	expect(() => {
		featureToggleManager.setDeployment(undefined);
	}).toThrow();
	expect(() => {
		featureToggleManager.setDeployment(null);
	}).toThrow();
	expect(() => {
		featureToggleManager.setDeployment(123);
	}).toThrow();
	expect(() => {
		featureToggleManager.setDeployment("");
	}).toThrow();
	expect(() => {
		featureToggleManager.setDeployment(" ");
	}).toThrow();

	// For FeatureToggleRouter.
	const featureToggleRouter = new FeatureToggleRouter();
	expect(() => {
		featureToggleRouter.setDeployment(undefined);
	}).toThrow();
	expect(() => {
		featureToggleRouter.setDeployment(null);
	}).toThrow();
	expect(() => {
		featureToggleRouter.setDeployment(123);
	}).toThrow();
	expect(() => {
		featureToggleRouter.setDeployment("");
	}).toThrow();
	expect(() => {
		featureToggleRouter.setDeployment(" ");
	}).toThrow();
});

test("Passing an invalid value for pass phrase should throw", () => {
	const featureToggleRouter = new FeatureToggleRouter();
	expect(() => {
		featureToggleRouter.validatePassPhrase(undefined);
	}).toThrow();
	expect(() => {
		featureToggleRouter.validatePassPhrase(null);
	}).toThrow();
	expect(() => {
		featureToggleRouter.validatePassPhrase(123);
	}).toThrow();
	expect(() => {
		featureToggleRouter.validatePassPhrase("");
	}).toThrow();
	expect(() => {
		featureToggleRouter.validatePassPhrase(" ");
	}).toThrow();
});

test("Passing a valid value for pass phrase", () => {
	const featureToggleRouter = new FeatureToggleRouter();
	expect(() => {
		featureToggleRouter.validatePassPhrase(testSignaturePassPhraseA);
	}).not.toThrow();
	expect(() => {
		featureToggleRouter.validatePassPhrase(testEncryptionPassPhraseA);
	}).not.toThrow();
});

test("Generating a signature keypair", async() => {
	const signatureKeypair = await featureToggleRouterA.generateSignatureKeyPair(testSignaturePassPhraseA);
	expect(typeof signatureKeypair === "object").toBe(true);
	expect(typeof signatureKeypair.privateKey === "string").toBe(true);
	expect(typeof signatureKeypair.publicKey === "string").toBe(true);
});

test("Generating an encryption keypair", async() => {
	const encryptionKeyPair = await featureToggleRouterA.generateEncryptionKeyPair(testEncryptionPassPhraseA);
	expect(typeof encryptionKeyPair === "object").toBe(true);
	expect(typeof encryptionKeyPair.privateKey === "string").toBe(true);
	expect(typeof encryptionKeyPair.publicKey === "string").toBe(true);
});

test("Getting deployment should return the set value", () => {
	// Check if it returns the value when set in the constructor.
	const featureToggleManager = new FeatureToggleManager(TEST_DEPLOYMENT_A);
	expect(featureToggleManager.getDeployment()).toBe(TEST_DEPLOYMENT_A);

	// Check if it returns the value when set using setDeployment.
	featureToggleManager.setDeployment(TEST_DEPLOYMENT_B);
	expect(featureToggleManager.getDeployment()).toBe(TEST_DEPLOYMENT_B);

	// Check if it returns the value when set again using setDeployment.
	featureToggleManager.setDeployment(TEST_DEPLOYMENT_A);
	expect(featureToggleManager.getDeployment()).toBe(TEST_DEPLOYMENT_A);
});

test("Getting signature keys should return the set value", async() => {
	const featureToggleManager = new FeatureToggleManager();

	// Check if it returns the value when set using setSignaturePrivateKey.
	await featureToggleManager.setSignaturePrivateKey(testSignaturePrivateKeyA, testSignaturePassPhraseA);
	expect(featureToggleManager.getSignaturePrivateKey()).toBe(testSignaturePrivateKeyA);
	expect(featureToggleManager.getSignaturePassPhrase()).toBe(testSignaturePassPhraseA);

	// Check if it returns the value when set again using setSignaturePrivateKey.
	await featureToggleManager.setSignaturePrivateKey(testSignaturePrivateKeyB, testSignaturePassPhraseB);
	expect(featureToggleManager.getSignaturePrivateKey()).toBe(testSignaturePrivateKeyB);
	expect(featureToggleManager.getSignaturePassPhrase()).toBe(testSignaturePassPhraseB);

	// Check if it returns the value when set using setSignaturePublicKey.
	await featureToggleManager.setSignaturePublicKey(testSignaturePublicKeyA);
	expect(featureToggleManager.getSignaturePublicKey()).toBe(testSignaturePublicKeyA);

	// Check if it returns the value when set again using setSignaturePublicKey.
	await featureToggleManager.setSignaturePublicKey(testSignaturePublicKeyB);
	expect(featureToggleManager.getSignaturePublicKey()).toBe(testSignaturePublicKeyB);
});

test("Getting encryption keys should return the set value", async() => {
	const featureToggleManager = new FeatureToggleManager();

	// Check if it returns the value when set using setEncryptionPrivateKey.
	await featureToggleManager.setEncryptionPrivateKey(testEncryptionPrivateKeyA, testEncryptionPassPhraseA);
	expect(featureToggleManager.getEncryptionPrivateKey()).toBe(testEncryptionPrivateKeyA);
	expect(featureToggleManager.getEncryptionPassPhrase()).toBe(testEncryptionPassPhraseA);

	// Check if it returns the value when set again using setEncryptionPrivateKey.
	await featureToggleManager.setEncryptionPrivateKey(testEncryptionPrivateKeyB, testEncryptionPassPhraseB);
	expect(featureToggleManager.getEncryptionPrivateKey()).toBe(testEncryptionPrivateKeyB);
	expect(featureToggleManager.getEncryptionPassPhrase()).toBe(testEncryptionPassPhraseB);

	// Check if it returns the value when set using setEncryptionPublicKey.
	await featureToggleManager.setEncryptionPublicKey(testEncryptionPublicKeyA);
	expect(featureToggleManager.getEncryptionPublicKey()).toBe(testEncryptionPublicKeyA);

	// Check if it returns the value when set again using setEncryptionPublicKey.
	await featureToggleManager.setEncryptionPublicKey(testSignaturePublicKeyA);
	expect(featureToggleManager.getEncryptionPublicKey()).toBe(testSignaturePublicKeyA);
});

test("Active configuration not to be undefined", () => {
	expect(featureToggleRouterA.getActiveConfiguration()).not.toBeUndefined();
});

test("Configurations to be a list", () => {
	expect(Array.isArray(featureToggleRouterA.getConfigurations())).toBe(true);
});

test("Configurations to be return all configurations with the passed source value", async() => {
	await featureToggleRouterA.loadConfiguration("TEST_CONFIGURATION_NO_FEATURES", TEST_CONFIGURATION_NO_FEATURES);
	await featureToggleRouterA.loadConfiguration("TEST_CONFIGURATION_BOOLEAN_SIMPLE", TEST_CONFIGURATION_BOOLEAN_SIMPLE);
	expect(featureToggleRouterA.getConfigurations().length).toBe(2);
});

test("Configurations to be return all parsed configurations", async() => {
	await featureToggleRouterA.loadConfiguration("source1", TEST_CONFIGURATION_NO_FEATURES);
	await featureToggleRouterA.loadConfiguration("source2", TEST_CONFIGURATION_BOOLEAN_SIMPLE);
	await featureToggleRouterA.loadConfiguration("source3", TEST_CONFIGURATION_NO_FEATURES);
	await featureToggleRouterA.loadConfiguration("source4", TEST_CONFIGURATION_BOOLEAN_SIMPLE);
	expect(featureToggleRouterA.getConfigurations("source1").length).toBe(1);
});

test.each([
	undefined,
	{}
])("Unexisting feature returns undefined for the passed configuration: %p", (configuration) => {
	expect(featureToggleRouterA.getValue("unexistingFeature", undefined, configuration)).toBeUndefined();
});

test.each([
	undefined,
	{}
])("Unexisting feature returns passed default value for the passed configuration: %p", (configuration) => {
	expect(featureToggleRouterA.getValue("unexistingFeature", "DefaultValue", configuration)).toBe("DefaultValue");
});

test.each([
	{ featureWithoutValue: {} }
])("Existing feature without ftrValue returns passed default value for configuration: %p", (configuration) => {
	expect(featureToggleRouterA.getValue("featureWithoutValue", "DefaultValue", configuration)).toBe("DefaultValue");
});
test("Existing feature without ftrValue returns passed default value", async() => {
	await featureToggleRouterA.loadConfiguration("TEST_CONFIGURATION_WITHOUT_VALUE", TEST_CONFIGURATION_WITHOUT_VALUE);
	expect(featureToggleRouterA.getValue("featureWithoutValue", "DefaultValue")).toBe("DefaultValue");
	expect(featureToggleRouterA.getValue("featureWithoutValue")).toBeUndefined();
});

test("Parsing configuration without features returns normally", () => {
	expect(async() => {
		await featureToggleRouterA.loadConfiguration("TEST_CONFIGURATION_NO_FEATURES", TEST_CONFIGURATION_NO_FEATURES);
	}).not.toThrow();
});

test("Existing boolean feature returns true for the passed configuration", () => {
	expect(featureToggleRouterA.getValue("booleanFeatureTrue", undefined, TEST_CONFIGURATION_BOOLEAN_SIMPLE)).toBe(true);
});
test("Existing boolean feature returns true for the active configuration", async() => {
	await featureToggleRouterA.loadConfiguration("TEST_CONFIGURATION_BOOLEAN_SIMPLE", TEST_CONFIGURATION_BOOLEAN_SIMPLE);
	expect(featureToggleRouterA.getValue("booleanFeatureTrue")).toBe(true);
});
test("Existing boolean feature returns false for the passed configuration", () => {
	expect(featureToggleRouterA.getValue("booleanFeatureFalse", undefined, TEST_CONFIGURATION_BOOLEAN_SIMPLE)).toBe(false);
});
test("Existing boolean feature returns false for the active configuration", async() => {
	await featureToggleRouterA.loadConfiguration("TEST_CONFIGURATION_BOOLEAN_SIMPLE", TEST_CONFIGURATION_BOOLEAN_SIMPLE);
	expect(featureToggleRouterA.getValue("booleanFeatureFalse")).toBe(false);
});

test("Existing boolean feature with metadata returns true for the passed configuration", () => {
	expect(featureToggleRouterA.getValue("booleanFeatureTrue", undefined, TEST_CONFIGURATION_BOOLEAN_METADATA)).toBe(true);
});
test("Existing boolean feature with metadata returns true for the active configuration", async() => {
	await featureToggleRouterA.loadConfiguration("TEST_CONFIGURATION_BOOLEAN_METADATA", TEST_CONFIGURATION_BOOLEAN_METADATA);
	expect(featureToggleRouterA.getValue("booleanFeatureTrue")).toBe(true);
});
test("Existing boolean feature with metadata returns false for the passed configuration", () => {
	expect(featureToggleRouterA.getValue("booleanFeatureFalse", undefined, TEST_CONFIGURATION_BOOLEAN_METADATA)).toBe(false);
});

test("Getting title and description works from the passed configuration", () => {
	const configuration = Object.freeze({
		parentFeatureX: {
			childFeatureX: {
				ftrTitle: {
					eng: "Test title"
				},
				ftrDescription: {
					eng: "Test description"
				}
			}
		}
	});
	expect(lodash.isEqual(
		featureToggleRouterA.getTitle("parentFeatureX.childFeatureX", undefined, configuration),
		{
			eng: "Test title"
		})
	).toBe(true);
	expect(lodash.isEqual(
		featureToggleRouterA.getDescription("parentFeatureX.childFeatureX", undefined, configuration),
		{
			eng: "Test description"
		})
	).toBe(true);
});

test("Getting title and description works from the active configuration", async() => {
	await featureToggleRouterA.loadConfiguration("local:local.json", {
		parentFeatureX: {
			childFeatureX: {
				ftrTitle: {
					eng: "Test title"
				},
				ftrDescription: {
					eng: "Test description"
				}
			}
		}
	});
	expect(lodash.isEqual(
		featureToggleRouterA.getTitle("parentFeatureX.childFeatureX"),
		{
			eng: "Test title"
		})
	).toBe(true);
	expect(lodash.isEqual(
		featureToggleRouterA.getDescription("parentFeatureX.childFeatureX"),
		{
			eng: "Test description"
		})
	).toBe(true);
});

test("Existing boolean feature with metadata returns false for the passed configuration", async() => {
	await featureToggleRouterA.loadConfiguration("TEST_CONFIGURATION_BOOLEAN_METADATA", TEST_CONFIGURATION_BOOLEAN_METADATA);
	expect(featureToggleRouterA.getValue("booleanFeatureFalse", undefined, TEST_CONFIGURATION_BOOLEAN_METADATA)).toBe(false);
});

test("Parsing multiple configurations returns normally", async() => {
	await featureToggleRouterA.loadConfiguration("TEST_CONFIGURATION_BOOLEAN_METADATA.1", TEST_CONFIGURATION_BOOLEAN_METADATA);
	await featureToggleRouterA.loadConfiguration("TEST_CONFIGURATION_BOOLEAN_METADATA.2", TEST_CONFIGURATION_BOOLEAN_METADATA);
	expect(featureToggleRouterA.getValue("booleanFeatureFalse")).toBe(false);
	expect(featureToggleRouterA.getFailedConfigurations().length).toBe(0);
});

test("Parsing multiple configurations with values for locked features do not get applied", async() => {
	await featureToggleRouterA.loadConfiguration("TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED", TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED);
	await featureToggleRouterA.loadConfiguration("TEST_CONFIGURATION_FEATURE_X_VALUE_B", TEST_CONFIGURATION_FEATURE_X_VALUE_B);
	expect(featureToggleRouterA.getValue("featureX")).toBe("ValueA");
});

test("Parsing signed configuration returns normally", async() => {
	const signedConfiguration = await featureToggleRouterA.sign(TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED);
	await featureToggleRouterA.loadConfiguration("TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED", signedConfiguration);
	const configurations = featureToggleRouterA.getConfigurations();
	expect(configurations.length).toBe(1);
	expect(configurations[0].error).toBeUndefined();
	expect(configurations[0].loaded).toBe(true);
	expect(featureToggleRouterA.getFailedConfigurations().length).toBe(0);
});

test("Parsing signed configuration without ftrDeployment returns normally but does not get applied", async() => {
	const signedConfiguration = await featureToggleRouterA.sign(TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED);
	delete signedConfiguration.ftrDeployment;

	await featureToggleRouterA.loadConfiguration("TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED", signedConfiguration);

	expect(featureToggleRouterA.getConfigurations().length).toBe(1);
	expect(featureToggleRouterA.getFailedConfigurations().length).toBe(1);
});

test("Parsing signed configuration with wrong ftrDeployment returns normally but does not get applied", async() => {
	// Sign with the same signature private key but different deployment.
	const featureToggleManager = new FeatureToggleManager(TEST_DEPLOYMENT_B);
	await featureToggleManager.setSignaturePrivateKey(testSignaturePrivateKeyA, testSignaturePassPhraseA);
	const signedConfiguration = await featureToggleManager.sign(TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED);

	// Load the configuration.
	await featureToggleRouterA.loadConfiguration("TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED", signedConfiguration);

	expect(featureToggleRouterA.getConfigurations().length).toBe(1);
	expect(featureToggleRouterA.getFailedConfigurations().length).toBe(1);
});

test("Parsing multiple configurations with signed values for locked features get applied", async() => {
	await featureToggleRouterA.loadConfiguration("TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED", TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED);
	const signedConfiguration = await featureToggleRouterA.sign(TEST_CONFIGURATION_FEATURE_X_VALUE_B);
	await featureToggleRouterA.loadConfiguration("TEST_CONFIGURATION_FEATURE_X_VALUE_B", signedConfiguration);
	expect(featureToggleRouterA.getValue("featureX")).toBe("ValueB");
});

test("Signing configuration without the correct configuration throws", async() => {
	let featureToggleManager;
	// TODO: Does it throw the expected error or does it throw something else. Same question for all such constructs in all tests.

	featureToggleManager = new FeatureToggleManager();
	featureToggleManager.setDeployment(TEST_DEPLOYMENT_A);
	expect(async() => {
		await featureToggleManager.sign(TEST_CONFIGURATION_FEATURE_X_VALUE_B);
	}).rejects.toThrow();

	featureToggleManager = new FeatureToggleManager();
	await featureToggleManager.setSignaturePrivateKey(testSignaturePrivateKeyA, testSignaturePassPhraseA);
	expect(async() => {
		await featureToggleManager.sign(TEST_CONFIGURATION_FEATURE_X_VALUE_B);
	}).rejects.toThrow();

	featureToggleManager = new FeatureToggleManager();
	expect(async() => {
		await featureToggleManager.sign(TEST_CONFIGURATION_FEATURE_X_VALUE_B);
	}).rejects.toThrow();
});

test("Signing configuration returns configuration with signature", async() => {
	const signedConfiguration = await featureToggleRouterA.sign(TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED);

	expect(signedConfiguration).not.toBeUndefined();
	expect(signedConfiguration.ftrSignature).not.toBeUndefined();
	expect(await featureToggleRouterA.isLicensed(signedConfiguration)).toBe(true);
});

test("Encrypting unsigned configuration returns encrypted configuration with signature", async() => {
	const unsignedConfiguration = TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED;
	const encryptedConfiguration = await featureToggleRouterA.encrypt(unsignedConfiguration);

	expect(encryptedConfiguration).not.toBeUndefined();
	expect(encryptedConfiguration.ftrLicense).not.toBeUndefined();
	expect(await featureToggleRouterA.isEncrypted(encryptedConfiguration)).not.toBe(false);
});

test("Encrypting signed configuration returns encrypted configuration with signature", async() => {
	const signedConfiguration = await featureToggleRouterA.sign(TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED);
	const encryptedConfiguration = await featureToggleRouterA.encrypt(signedConfiguration);

	expect(encryptedConfiguration).not.toBeUndefined();
	expect(encryptedConfiguration.ftrLicense).not.toBeUndefined();
	// expect(await featureToggleRouterA.isLicensed(signedConfiguration)).toBe(true);
});

test("Locked features can be set to allowed locked values", async() => {
	// Create a locked featureX.
	await featureToggleRouterA.loadConfiguration("TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED", TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED);

	// Limit the allowed values to 3 values.
	const signedConfiguration = await featureToggleRouterA.sign(TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED_VALUES_3_OPTIONS);
	await featureToggleRouterA.loadConfiguration("TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED_VALUES_3_OPTIONS", signedConfiguration);

	// Set the value to an allowed value.
	await featureToggleRouterA.setValue("api:setValue", "featureX", "ValueB");

	// Check if the value is applied.
	expect(featureToggleRouterA.getValue("featureX")).toBe("ValueB");
});

test("Setting a value works and loads as an extra configuration", async() => {
	await featureToggleRouterA.setValue("api:setValue", "featureX", "ValueA");
	expect(featureToggleRouterA.getValue("featureX")).toBe("ValueA");

	const configurations = featureToggleRouterA.getConfigurations();
	expect(configurations.length).toBe(1);
	expect(configurations[0].loaded).toBe(true);
});

test("Getting the locked state works when passing the configuration", () => {
	expect(featureToggleRouterA.isLocked("featureX", TEST_CONFIGURATION_FEATURE_X_VALUE_B)).toBe(false);
	expect(featureToggleRouterA.isLocked("featureX", TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED)).toBe(true);
});

test("Setting the locked state works and loads as an extra configuration", async() => {
	// Check for an unexisting feature.
	expect(featureToggleRouterA.isLocked("featureX")).toBe(false);

	// Check fo a feature for which it is set tot true.
	await featureToggleRouterA.setLocked("setLocked", "featureX", true);
	expect(featureToggleRouterA.isLocked("featureX")).toBe(true);

	const configurations = featureToggleRouterA.getConfigurations();
	expect(configurations.length).toBe(1);
	expect(configurations[0].loaded).toBe(true);
});

test("Setting the locked state to a non-boolean value fails", () => {
	expect(async() => {
		await featureToggleRouterA.setLocked("setLocked", "featureX", 0);
	}).rejects.toThrow();
	expect(async() => {
		await featureToggleRouterA.setLocked("setLocked", "featureX", 1);
	}).rejects.toThrow();
	expect(async() => {
		await featureToggleRouterA.setLocked("setLocked", "featureX", "false");
	}).rejects.toThrow();
	expect(async() => {
		await featureToggleRouterA.setLocked("setLocked", "featureX", "true");
	}).rejects.toThrow();
});

test("Locked features cannot be set to not allowed values", async() => {
	// Create a locked featureX.
	// featureToggleRouter2.parseConfiguration("TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED", TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED);
	await featureToggleRouterA.loadConfiguration("TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED", { featureX: { ftrValue: "ValueA", ftrLocked: true } });

	// Limit the allowed values to 2 values.
	const signedConfiguration = await featureToggleRouterA.sign(TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED_VALUES_2_OPTIONS);
	await featureToggleRouterA.loadConfiguration("TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED_VALUES_2_OPTIONS", signedConfiguration);

	// Set the value to a not allowed value.
	await featureToggleRouterA.setValue("api:setValue", "featureX", "ValueC");

	// Check if the value is not applied.
	expect(featureToggleRouterA.getValue("featureX")).toBe("ValueA");
});

test("Locked values cannot be set to non-subset allowed values", async() => {
	// Create a locked featureX.
	await featureToggleRouterA.loadConfiguration("TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED", TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED);
	// await featureToggleRouterA.loadConfiguration("TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED", { featureX: { ftrValue: "ValueA", ftrLocked: true } });

	// Limit the allowed values to 2 values.
	const signedConfiguration = await featureToggleRouterA.sign(TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED_VALUES_2_OPTIONS);
	await featureToggleRouterA.loadConfiguration("TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED_VALUES_2_OPTIONS", signedConfiguration);

	// Limit the allowed values to 3 values.
	await featureToggleRouterA.loadConfiguration("TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED_VALUES_3_OPTIONS", TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED_VALUES_3_OPTIONS);

	// Set the value to a not allowed value.
	await featureToggleRouterA.setValue("api:setValue", "featureX", "ValueC");

	// Check if the value is not applied.
	expect(featureToggleRouterA.getValue("featureX")).toBe("ValueA");
});

test("UC-1: Zappware licensing use case", async() => {
	const zappwareFeatureToggleManager = new FeatureToggleManager(TEST_DEPLOYMENT_A);
	// Zappware needs to be able to sign and encrypt a configuration file.
	await zappwareFeatureToggleManager.setSignaturePrivateKey(testSignaturePrivateKeyA, testSignaturePassPhraseA);
	await zappwareFeatureToggleManager.setEncryptionPublicKey(testEncryptionPublicKeyA);

	const licenseConfiguration = Object.freeze({
		booleanFeatureSimple: true,
		booleanFeatureAdvanced: {
			ftrValue: true,
			ftrType: "boolean",
			ftrTitle: {
				eng: "Advanced boolean feature",
				nld: "Geavanceerde booleaanse functionaliteit"
			},
			ftrDescription: {
				eng: "This is an advanced boolean feature.",
				nld: "Dit is een geavanceerde booleaanse functionaliteit."
			},
			subBooleanFeatureSimple: true,
			subBooleanFeatureAdvanced: {
				ftrValue: true,
				ftrType: "boolean"
			},
			subIntegerParameterSimple: 123,
			subIntegerParameterAdvanced: {
				ftrValue: 123,
				ftrType: "integer",
				ftrRange: [1, 300],
				ftrTitle: {
					eng: "Advanced integer subfeature",
					nld: "Geavanceerd geheel getal subfunctionaliteit"
				},
				ftrDescription: {
					eng: "This is an advanced integer subfeature.",
					nld: "Dit is een geavanceerde geheel getal subfunctionaliteit."
				},
				ftrOptInEnabled: true,
				ftrOptInValues: [
					{
						value: "1",
						title: {
							eng: "Option 1",
							nld: "Optie 1"
						},
						description: {
							eng: "This is the first option.",
							nld: "Dit is de eerste optie."
						}
					}, {
						value: "2",
						title: {
							eng: "Option 2",
							nld: "Optie 2"
						},
						description: {
							eng: "This is the second option.",
							nld: "Dit is de tweede optie."
						}
					}
				]
			},
			subStringParameterSimple: "3.1.3",
			subStringParameterAdvanced: {
				ftrValue: "3.1.3",
				ftrType: "string",
				ftrValidationRegex: "^\\d{1,2}\\.\\d{1,2}\\.\\d{1,2}$",
				ftrTitle: {
					eng: "Advanced string feature",
					nld: "Geavanceerde textuele functionaliteit"
				},
				ftrDescription: {
					eng: "This is an advanced string subfeature.",
					nld: "Dit is een geavanceerde textuele subfunctionaliteit."
				},
				ftrOptInEnabled: false,
				ftrOptInValues: [
					{
						value: "BLUE",
						title: {
							eng: "Blue",
							nld: "Blauw"
						},
						description: {
							eng: "The color blue.",
							nld: "De kleur blauw."
						}
					}, {
						value: "RED",
						title: {
							eng: "Red",
							nld: "Rood"
						},
						description: {
							eng: "The color red.",
							nld: "De kleur rood."
						}
					}
				]
			}
		},
		integerFeatureSimple: 123,
		integerFeatureAdvanced: {
			ftrValue: 123,
			ftrType: "integer"
		},
		stringFeatureSimple: "ValueA",
		stringFeatureAdvanced: {
			ftrValue: "ValueA",
			ftrType: "string"
		}
	});
	const licenseConfigurationEncrypted = await zappwareFeatureToggleManager.encrypt(licenseConfiguration);

	// TODO: Add Marketing Console feature toggle router to read the ftr... fields needed to edit/create the configurations.

	const clientFeatureToggleRouter = new FeatureToggleRouter(TEST_DEPLOYMENT_A);
	// The client needs to be able to decrypt and verify the signature of a configuration file.
	await clientFeatureToggleRouter.setSignaturePublicKey(testSignaturePublicKeyA);
	await clientFeatureToggleRouter.setEncryptionPrivateKey(testEncryptionPrivateKeyA, testEncryptionPassPhraseA);

	// TODO: Add extra check to the feature toggle router that the first one to be loaded needs to be a licensed configuration. To prevent someone from replacing the first loaded by an unsigned setting undesired defaults.
	const configurationStatus = await clientFeatureToggleRouter.loadConfiguration("local:license.json", licenseConfigurationEncrypted);
	expect(configurationStatus.error).toBeUndefined();

	expect(clientFeatureToggleRouter.getConfigurations().length).toBe(1);
	expect(clientFeatureToggleRouter.getFailedConfigurations().length).toBe(0);

	// TODO: Add checks for the ftr... fields a client needs to show the viewer feature opt-in screen.

	// TODO: Add checks for the ftr... fields a client needs to show the QA feature settings screen.
});

test("Debug info enabled for loading configurations", async() => {
	// Load configurations to ensure the code for adding the debug info is triggered.
	const featureToggleRouter = new FeatureToggleRouter(TEST_DEPLOYMENT_A, true);
	// IMPORTANT! No signature or encryption keys need to be set if the configurations are not signed or encrypted.
	// await featureToggleRouter.setSignaturePrivateKey(testSignaturePrivateKeyA, testSignaturePassPhraseA);
	// await featureToggleRouter.setSignaturePublicKey(testSignaturePublicKeyA);
	// await featureToggleRouter.setEncryptionPrivateKey(testEncryptionPrivateKeyA, testEncryptionPassPhraseA);
	// await featureToggleRouter.setEncryptionPublicKey(testEncryptionPublicKeyA);
	await featureToggleRouter.loadConfiguration("1", TEST_CONFIGURATION_BOOLEAN_SIMPLE);
	await featureToggleRouter.loadConfiguration("2", TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED_VALUES_2_OPTIONS);
	await featureToggleRouter.loadConfiguration("3", TEST_CONFIGURATION_FEATURE_X_VALUE_A_LOCKED);

	expect(featureToggleRouter.getConfigurations().length).toBe(3);
	expect(featureToggleRouter.getFailedConfigurations().length).toBe(0);
	expect(featureToggleRouter.getTitle("featureX")).toBe(undefined);
	expect(featureToggleRouter.getDescription("featureX")).toBe(undefined);
});
