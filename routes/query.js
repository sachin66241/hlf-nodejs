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

router.get('/get-balance/:user', async function(req, res, next) {
  try {
    const walletPath = path.join(process.cwd(), '..', 'node-interface', 'wallet');
    const wallet = new FileSystemWallet(walletPath);

    const user = req.params.user.split('.')[1];

    const userExists = await wallet.exists(user);
    if (!userExists) {
      return res.status(500).send('An identity for the user ' + user + ' does not exist in the wallet');
    }

    const gateway = new Gateway();
    await gateway.connect(ccpPath, { wallet, identity: user, discovery: { enabled: true, asLocalhost: true } });

    const network = await gateway.getNetwork(CHANNEL_NAME);
    const contract = network.getContract(CONTRACT_NAME);

    const result = await contract.evaluateTransaction('getBalance', req.params.user);
    res.status(200).json(result.toString());
  } catch (error) {
    return res.status(500).send(`Failed to evaluate transaction: ${error}`);
  }
});

router.get('/get-history/:user', async function(req, res, next) {
  try {
    const walletPath = path.join(process.cwd(), '..', 'node-interface', 'wallet');
    const wallet = new FileSystemWallet(walletPath);

    const user = req.params.user.split('.')[1];

    const userExists = await wallet.exists(user);
    if (!userExists) {
      return res.status(500).send('An identity for the user ' + user + ' does not exist in the wallet');
    }

    const gateway = new Gateway();
    await gateway.connect(ccpPath, { wallet, identity: user, discovery: { enabled: true, asLocalhost: true } });

    const network = await gateway.getNetwork(CHANNEL_NAME);

    const contract = network.getContract(CONTRACT_NAME);

    const result = await contract.evaluateTransaction('getHistory', req.params.user);
    return res.send(JSON.parse(result));
  } catch (error) {
    return res.status(500).send(`Failed to evaluate transaction: ${error}`);
  }
});

router.get('/check-user/:user', async function(req, res, next) {
  try {
    const walletPath = path.join(process.cwd(), '..', 'node-interface', 'wallet');
    const wallet = new FileSystemWallet(walletPath);

    const user = req.params.user.split('.')[1];

    const userExists = await wallet.exists(user);
    if (!userExists)
        return res.status(200).json(false);
    else return res.status(200).json(true);
  } catch (error) {
    return res.status(500).send('Something went wrong');
  }
});

module.exports = router;