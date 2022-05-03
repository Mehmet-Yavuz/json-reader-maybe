const licenseConfiguration = require("./appcfg_stb_features.json");
const FeatureToggleRouter = require("./feature_toggle_router.js");
const FeatureToggleManager = require("./feature_toggle_manager.js");

const TEST_DEPLOYMENT_A = "Deployment A";

const featureToggleManager = new FeatureToggleManager();

async function run() {
    let testSignaturePassPhraseA = "Signature Pass Phrase A";
    const signatureKeyPairA = await featureToggleManager.generateSignatureKeyPair(testSignaturePassPhraseA);
    let testSignaturePrivateKeyA = signatureKeyPairA.privateKey;
    let testSignaturePublicKeyA = signatureKeyPairA.publicKey;

    let testEncryptionPassPhraseA = "Encryption PassPhrase A";
    const encryptionKeyPairA = await featureToggleManager.generateEncryptionKeyPair(testEncryptionPassPhraseA);
    let testEncryptionPrivateKeyA = encryptionKeyPairA.privateKey;
    let testEncryptionPublicKeyA = encryptionKeyPairA.publicKey;

    const zappwareFeatureToggleManager = new FeatureToggleManager(TEST_DEPLOYMENT_A, true);
    // Zappware needs to be able to sign and encrypt a configuration file.
    await zappwareFeatureToggleManager.setSignaturePublicKey(testSignaturePublicKeyA);
    await zappwareFeatureToggleManager.setSignaturePrivateKey(testSignaturePrivateKeyA, testSignaturePassPhraseA);
    await zappwareFeatureToggleManager.setEncryptionPublicKey(testEncryptionPublicKeyA);

    const licenseConfigurationEncrypted = await zappwareFeatureToggleManager.encrypt(licenseConfiguration);
    await zappwareFeatureToggleManager.loadConfiguration("test.json", licenseConfigurationEncrypted);

    await zappwareFeatureToggleManager.setEncryptionPrivateKey(testEncryptionPrivateKeyA, testEncryptionPassPhraseA);

    // TODO: Add Marketing Console feature toggle router to read the ftr... fields needed to edit/create the configurations.

    const clientFeatureToggleRouter = new FeatureToggleRouter(TEST_DEPLOYMENT_A, true);
    // The client needs to be able to decrypt and verify the signature of a configuration file.
    await clientFeatureToggleRouter.setSignaturePublicKey(testSignaturePublicKeyA);
    await clientFeatureToggleRouter.setEncryptionPrivateKey(testEncryptionPrivateKeyA, testEncryptionPassPhraseA);

    // TODO: Add extra check to the feature toggle router that the first one to be loaded needs to be a licensed configuration. To prevent someone from replacing the first loaded by an unsigned setting undesired defaults.
    const configurationStatus = await clientFeatureToggleRouter.loadConfiguration("local:license.json", licenseConfigurationEncrypted);

    // TODO: Add checks for the ftr... fields a client needs to show the viewer feature opt-in screen.

    // TODO: Add checks for the ftr... fields a client needs to show the QA feature settings screen.
    return await zappwareFeatureToggleManager.getFeatureMetadata("model", licenseConfigurationEncrypted);
}

const express = require("express");
const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
    run().then((data) => {
        res.json(data);
      })
      .catch((error) => {
        res.json(error);
      });
});

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});