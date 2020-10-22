//const pairsCalcul = require('./pairs.js');
const axios = require('axios');
const pairsData = require('./Output.json'); //ONLY HAS 1600 pairs!!!
const fs = require('fs');
const express = require('express');

const app = express();

const UNI_URL = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2';
const WETH_ADD = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

app.get('/ethPriceUSD', async (req, res) => {
  const price = await ethPriceUSD();
  res.send({priceETH: price});
});

app.get('/tokensVolumeOrder', async (req, res) => {
  const tokens = await tokensVolumeOrder();
  res.send(tokens);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening no port ${port}...`));

//top volume top 300 tokens - volumeUSD and liquidity
const tokensVolumeOrder = async () => {
  try{
    const result = await axios.post(
      UNI_URL,
      {
        query: `{
          tokens(first: 300, orderBy: tradeVolumeUSD, orderDirection: desc) {
            id
            symbol
            tradeVolumeUSD
            totalLiquidity
            derivedETH
          }
        }`
      }
    );
    return result.data.data.tokens;
  }catch(error){
    console.error('Error in Volume order', error);
  }
}

//price of ETH in USD
const ethPriceUSD = async () => {
  try{
    const result = await axios.post(
      UNI_URL,
      {
        query: `{
          bundle(id: "1") {
            id
            ethPrice
          }
        }`
      }
    );
    return result.data.data.bundle.ethPrice;
  }catch(error){
    console.error('Error in token price', error);
  }
}

//price of given token in USD
const tokenPriceUSD = async (tokenId) => {
  try{
    const result = await axios.post(
      UNI_URL,
      {
        query: `{
          token(id: "${tokenId}" ) {
            id
            symbol
            derivedETH
          }
        }`
      }
    );
    ethPrice = await ( ethPriceUSD() );
    price = result.data.data.token.derivedETH * ethPrice;
    return price;
  }catch(error){
    console.error('Error in token price', error);
  }
}

//get pair id from two tokens addresses
function getPairId(token0, token1){
  try {
    const jsonString = fs.readFileSync('./Output.json')
    const pairsJson = JSON.parse(jsonString)
    return pairsJson["pairs"][token0][token1];
  } catch(err) {
    console.log('Error in getting the pair id', err)
    return
  }
}

//created at timestamp
const dateCreationPairWithEth = async (tokenId) => {
  try{
    //find pairs using token id
    var pairId = getPairId(tokenId,WETH_ADD);
    console.log(pairId)

    const result = await axios.post(
      UNI_URL,
      {
        query: `{
          pair(id: "${pairId}") {
            createdAtTimestamp
          }
        }`
      }
    );
    var timestamp = result.data.data.pair.createdAtTimestamp;
    console.log(timestamp);
    var date = new Date(timestamp*1000);
    console.log(date.toUTCString());
  }catch(error){
    console.error('Error in date creation', error);
  }
}
