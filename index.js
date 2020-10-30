//const pairsCalcul = require('./pairs.js');
const axios = require('axios');
const pairsData = require('./Output.json'); //ONLY HAS 1600 pairs!!!
const fs = require('fs');
const express = require('express');
const math = require('mathjs');

const app = express();

const UNI_URL = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2';
const WETH_ADD = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

//GET REQUESTS

app.get('/ethPriceUSD', async (req, res) => {
  const price = await ethPriceUSD();
  res.send({priceETH: price});
});

app.get('/tokenPriceUSD/:tokenId', async (req, res) => {

  try{
    const price = await tokenPriceUSD(req.params.tokenId);
    res.send({priceOfToken: price});
  }catch(error){
    console.error('Error in getting price', error);
  }
});

app.get('/tokensVolumeOrder', async (req, res) => {
  try{
    const tokens = await tokensVolumeOrder();
    res.send({firsttokens: tokens});
  }catch(err){
    res.send(err)
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening no port ${port}...`));



//GRAPHQL REQUESTS

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
  }catch(err){
    console.log("Error in tokens Volume Order", err);
    return 0;
  }

}

//IDs of top volume top 300 tokens - volumeUSD and liquidity
const tokensVolumeOrderIDs = async () => {
  try{
    const result = await axios.post(
      UNI_URL,
      {
        query: `{
          tokens(first: 300, orderBy: tradeVolumeUSD, orderDirection: desc) {
            id
            derivedETH
          }
        }`
      }
    );
    return result.data.data.tokens;
  }catch(error){
    console.error('Error in Volume order', error);
    return 0;
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




//JSON REGISTERS

//register token's price
async function registerPrice(){
  //list of ids
  console.log('register price');
  let pricesRecords = JSON.parse(fs.readFileSync('Prices.json'));
  let tokensRecords = JSON.parse(fs.readFileSync('TokensVolumeOrder.json'));
  let ethPrice = await ethPriceUSD();

  for(i=0; i < 300; i++){
    if(pricesRecords[i].id == tokensRecords[i].id){
      let price = tokensRecords[i].derivedETH*ethPrice;
      pricesRecords[i].prices.shift();
      pricesRecords[i].prices.push(price);
      pricesRecords[i].std = math.std(pricesRecords[i].prices)*100/price;
    }else{
      for(j=0; j < 300; j++){
        if(pricesRecords[i].id == tokensRecords[j].id){
          let price = tokensRecords[j].derivedETH*ethPrice;
          pricesRecords[i].prices.shift();
          pricesRecords[i].prices.push(price);
          pricesRecords[i].std = math.std(pricesRecords[i].prices)*100/price;
        }
      }
    }
  }
  json = JSON.stringify(pricesRecords); //convert it back to json
  fs.writeFileSync('Prices.json', json) // write it back
}
setInterval(registerPrice, 15000); //3600000 one hour
//initialise Price Records to 0
/*async function initialisePriceRegister(){
  //tokenPriceNow = await tokenPriceUSD("0x1f9840a85d5af5bf1d1762f925bdaddc4201f984");
  var tokens = await tokensVolumeOrderIDs();
  //initialise JSON
  var obj = {};
  for(i=0; i< 300; i++){
    tokenId = tokens[i].id;
    obj[i] = {id: tokenId, prices: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]};
  }
  var json = JSON.stringify(obj);
  //modify it and write it back to json
  fs.writeFile('Prices.json', json, (err) => {
      // In case of a error throw err.
      if (err) throw err;
  });
}
initialisePriceRegister(); */
//registerPrice();

//register token's price
/*async function registerPrice2(){
  //list of ids
  console.log('register price2');
  let pricesRecords = JSON.parse(fs.readFileSync('Prices.json'));

  for(i=0; i < 300; i++){
    let price = 0;
    try{
      price = await tokenPriceUSD(pricesRecords[i].id);
    }catch(err){
      console.log('Price not found', err);
      console.log(i);
    }
    if(price)
    pricesRecords[i].prices.shift();
    pricesRecords[i].prices.push(price);
  }

  json = JSON.stringify(pricesRecords); //convert it back to json
  fs.writeFileSync('Prices.json', json) // write it back

}*/
//setInterval(registerPrice2, 15000);

async function recordTokensVolumeOrder(){
  console.log('try records tokens volume order');
  let data = await tokensVolumeOrderIDs();
  if(data != 0){
    var json = JSON.stringify(data);
    fs.writeFile('TokensVolumeOrder.json', json, (err) => {
        // In case of a error throw err.
        if (err) throw err;
    });
  }
}
setInterval(recordTokensVolumeOrder, 17000); //every minute

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
