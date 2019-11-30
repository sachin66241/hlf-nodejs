'use strict';

var express = require('express');
var router = express.Router();

const { FileSystemWallet, Gateway } = require('fabric-network');
const path = require('path');

var config = require('../config');
const CONNECTION_PROFILE = config.connection_profile;
const CHANNEL_NAME = config.network;
const CONTRACT_NAME = config.contract;

const ccpPath = path.resolve(__dirname, '..', '..', 'hlf-network', 'connection', 'profiles', CONNECTION_PROFILE);

router.post('/allot-token', async function(req, res, next) {
  try {
    const amount = req.body.amount;
    const username = req.body.username;

    const walletPath = path.join(process.cwd(), '..', 'node-interface', 'wallet');
    const wallet = new FileSystemWallet(walletPath);

    const user = 'user2';

    const userExists = await wallet.exists(user);
    if (!userExists) {
        return res.status(500).send('An identity for the user ' + user + ' does not exist in the wallet');
    }

    const gateway = new Gateway();
    await gateway.connect(ccpPath, { wallet, identity: user, discovery: { enabled: true, asLocalhost: true } });
    const network = await gateway.getNetwork(CHANNEL_NAME);
    const contract = network.getContract(CONTRACT_NAME);

    await contract.submitTransaction('allot', username, amount);
    await gateway.disconnect();
    res.status(200).send('Transaction has been submitted');
  } catch (error) {
    res.status(500).send(`Failed to evaluate transaction: ${error}`);
  }
});

router.post('/transfer-token', async function(req, res, next) {
  try {
    const from = req.body.from;
    const to = req.body.to;
    const amount = req.body.amount;

    const walletPath = path.join(process.cwd(), '..', 'node-interface', 'wallet');
    const wallet = new FileSystemWallet(walletPath);

    const user = from.split('.')[1];

    const userExists = await wallet.exists(user);
    if (!userExists) {
      return res.status(500).send('An identity for the user ' + user + ' does not exist in the wallet');
    }

    const gateway = new Gateway();
    await gateway.connect(ccpPath, { wallet, identity: user, discovery: { enabled: true, asLocalhost: true } });
    const network = await gateway.getNetwork(CHANNEL_NAME);
    const contract = network.getContract(CONTRACT_NAME);

    await contract.submitTransaction('transfer', to, amount);
    await gateway.disconnect();
    res.status(200).send('Transaction has been submitted');
  } catch (error) {
    res.status(500).send(`Failed to evaluate transaction: ${error}`);
  }
});

module.exports = router;