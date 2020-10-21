//const pairsCalcul = require('./pairs.js');
const axios = require('axios');
const pairsData = require('./Output.json'); //ONLY HAS 1600 pairs!!!
const fs = require('fs');

const UNI_URL = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2';
const WETH_ADD = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';


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
    console.log(result.data.data.tokens);
  }catch(error){
    console.error('Error in Volume order', error);
  }
}

//price of ETH in USD
const ethPriceUSD = async (tokenId) => {
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

//liquiditypositions = number of suppliers


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

dateCreationPairWithEth("0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e");
tokenPriceUSD("0xdac17f958d2ee523a2206206994597c13d831ec7");
