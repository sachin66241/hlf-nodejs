'use strict';

var express = require('express');
var router = express.Router();

const { FileSystemWallet, Gateway, X509WalletMixin } = require('fabric-network');
const path = require('path');

var config = require('../config');
const CONNECTION_PROFILE = config.connection_profile;
const CHANNEL_NAME = config.network;
const CONTRACT_NAME = config.contract;

const ccpPath = path.resolve(__dirname, '..', '..', 'hlf-network', 'connection', 'profiles', CONNECTION_PROFILE);

router.post('/assign-admin', async function(req, res, next) {
  try {
    const walletPath = path.join(process.cwd(), '..', 'node-interface', 'wallet');
    const wallet = new FileSystemWallet(walletPath);

    const user = 'contractAdmin';

    const userExists = await wallet.exists(user);
    if (!userExists) {
      return res.status(500).send('An identity for the user ' + user + ' does not exist in the wallet');
    }

    const gateway = new Gateway();
    await gateway.connect(ccpPath, { wallet, identity: user, discovery: { enabled: true, asLocalhost: true } });
    const network = await gateway.getNetwork(CHANNEL_NAME);
    const contract = network.getContract(CONTRACT_NAME);

    await contract.submitTransaction('assignAdmin');
    await gateway.disconnect();
    return res.status(200).send('Transaction has been submitted');
  } catch (error) {
    return res.status(500).send(`Failed to evaluate transaction: ${error}`);
  }
});

router.post('/register-user', async function(req, res, next) {
  try {
    const user = req.body.username;
    const walletPath = path.join(process.cwd(), '..', 'node-interface', 'wallet');
    const wallet = new FileSystemWallet(walletPath);

    const userExists = await wallet.exists(user);
    if (userExists) {
      return res.status(500).send('An identity for the ' + user + ' already exists in the wallet');
    }

    const adminExists = await wallet.exists('admin');
    if (!adminExists) {
      return res.status(500).send('An identity for the admin user "admin" does not exist in the wallet');
    }

    const gateway = new Gateway();
    await gateway.connect(ccpPath, { wallet, identity: 'admin', discovery: { enabled: true, asLocalhost: true } });

    const ca = gateway.getClient().getCertificateAuthority();
    const adminIdentity = gateway.getCurrentIdentity();

    const secret = await ca.register({ enrollmentID: user, role: 'client' }, adminIdentity);
    const enrollment = await ca.enroll({ enrollmentID: user, enrollmentSecret: secret });
    const userIdentity = X509WalletMixin.createIdentity('Org2MSP', enrollment.certificate, enrollment.key.toBytes());
    await wallet.import(user, userIdentity);
    return res.status(200).send('Successfully registered and enrolled admin user ' + user + ' and imported it into the wallet');
  } catch (error) {
    return res.status(500).send(`Failed to evaluate transaction: ${error}`);
  }
});

module.exports = router;