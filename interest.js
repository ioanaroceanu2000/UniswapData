const fs = require('fs');
const express = require('express');
const math = require('mathjs');

const tokensVariables = JSON.parse(fs.readFileSync('TokensVariables.json'));

//calculate collateral
function collateralFactor(tokenId){
  variables = findVariables(tokenId);
  if(variables == null){
    return null;
  }
  const volatility = variables["volatility"];
  let coll1 = 0;
  let coll2 = 0;

  if(volatility < 10){
    coll1 = 65 + (-3.5)*volatility
  }else if(volatility < 50){
    coll1 = 35 + (-0.5)*volatility
  }else{
    return null; // discard token with huge volatility
  }

  //coefficient should change to m*(now - 19th of may) + 65 = 0
  let dateCreation = new Date(2020, 6, 19); //deployment of Uniswap V2

  if(variables["creationDate"] == 1){
    coll2 = 65;
  }else{
    let tokenDate = Date.parse(variables["creationDate"]);
    let difference = dateDifference(dateCreation, tokenDate);
    coll2 = (-0.465)*(difference) + 65;
  }

  return 0.75*coll1 + 0.25*coll2;
}
//collateralFactor("0x88ef27e69108b2633f8e1c184cc37940a075cc02");

//UTILITY function - returns the days difference date2-date1
function dateDifference(date1, date2){
  var one_day=1000*60*60*24;

  // Convert both dates to milliseconds
  var date1_ms = new Date(date1).getTime();
  var date2_ms = new Date(date2).getTime();

  // Calculate the difference in milliseconds
  var difference_ms = date2_ms - date1_ms;

  // Convert back to days and return
  return Math.round(difference_ms/one_day);
}

//calculate Uo
function optimalUtilisation(tokenId){
  let u = 0;
  // for stable coins and eth  set as aave
  // array of ids for [WETH, DAI, USDC,USDT,sUSD,BUSD,TUSD]
  const keyTokens = {"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": 65, "0x6b175474e89094c44da98b954eedeac495271d0f": 80, "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": 80,"0xdac17f958d2ee523a2206206994597c13d831ec7" : 80, "0x57ab1ec28d129707052df4df418d58a2d46d5f51": 80, "0x4fabb145d64652a948d72533023f6e7a623c7c53": 80,"0x0000000000085d4780b73119b644ae5ecd22b376": 80};
  let variables = findVariables(tokenId);
  if(variables == null){
    return null;
  }

  if(tokenId in keyTokens){
    return keyTokens[tokenId];
  }
  if(variables["volatility"] <= 1.5){
    u = (-20)*variables["volatility"] + 70;
  }
  else{ u = 40 }
  //volume going from 2 000000 to 1 500 000 000
  let add = (parseFloat(variables["volume"])/1000000)*0.0067 - 0.0134;

  return u + add;

}
//optimalUtilisation("0x6b3595068778dd592e39a122f4f5a5cf09c90fe2");

//calculate base rates
function baseRate(tokenId){
  const keyTokens = {"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": 65, "0x6b175474e89094c44da98b954eedeac495271d0f": 80, "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": 80,"0xdac17f958d2ee523a2206206994597c13d831ec7" : 80, "0x57ab1ec28d129707052df4df418d58a2d46d5f51": 80, "0x4fabb145d64652a948d72533023f6e7a623c7c53": 80,"0x0000000000085d4780b73119b644ae5ecd22b376": 80};
  //let variables = findVariables(tokenId);
  if(tokenId in keyTokens){
    return 1;
  }else{
    return 0;
  }
}

// calculate slope 1 and 2
function slopes(){
  return [7,200];
}

// calculate spread
function spread(tokenId){
  const keyTokens = {"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": 65, "0x6b175474e89094c44da98b954eedeac495271d0f": 80, "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": 80,"0xdac17f958d2ee523a2206206994597c13d831ec7" : 80, "0x57ab1ec28d129707052df4df418d58a2d46d5f51": 80, "0x4fabb145d64652a948d72533023f6e7a623c7c53": 80,"0x0000000000085d4780b73119b644ae5ecd22b376": 80};
  if(tokenId in keyTokens){
    return 2;
  }else{
    return 0;
  }

}

//find token's tokensVariables
function findVariables(tokenId){
  for(i = 0; i < 300; i ++){
    vars = tokensVariables[i];
    if(vars["id"] == tokenId && vars["volatility"] != null && vars["volume"] != 0){
      return tokensVariables[i];
    }
  }
  return null;
}

//register interest rate variables in a JSON
function registerIRVariables(){
  let obj = {};
  let j = 0;
  let i = 0;
  while( i < 300){
    let tokenId = tokensVariables[i]["id"];
    let coll = collateralFactor(tokenId);
    if(coll != null){
      obj[j] = {};
      obj[j]["id"] = tokenId;
      obj[j]["symbol"] = tokensVariables[i]["symbol"]
      obj[j]["utilisationRate"] = optimalUtilisation(tokenId);
      obj[j]["collateral"] = coll;
      obj[j]["baseRate"] = baseRate(tokenId);
      obj[j]["slope1"] = slopes()[0];
      obj[j]["slope2"] = slopes()[1];
      obj[j]["spread"] = spread(tokenId);
      j++;
    }
    i++;
  }
  json = JSON.stringify(obj); //convert it back to json
  fs.writeFileSync('InterestRateVars.json', json) // write it back
}

registerIRVariables();
