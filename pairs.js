const axios = require('axios');
const fs = require('fs') ;
const UNI_URL = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2';

// array of ids for [WETH, DAI, USDC,USDT,sUSD,BUSD,TUSD]
const keyTokens = ["0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", "0x6b175474e89094c44da98b954eedeac495271d0f", "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48","0xdac17f958d2ee523a2206206994597c13d831ec7", "0x57ab1ec28d129707052df4df418d58a2d46d5f51", "0x4fabb145d64652a948d72533023f6e7a623c7c53","0x0000000000085d4780b73119b644ae5ecd22b376"];

function mapToObj(map){
  var obj = {};
  map.forEach(function(v, k){
    obj[k] = simpleMapToObj(v);
  })
  return obj;
}

function simpleMapToObj(map){
  var obj = {};
  map.forEach(function(v, k){
    obj[k] = v;
  })
  return obj;
}



//remember all pairs
const computeAllPairs = async () => {
  try{
    let pairsMap = new Map();
    const increment = 1000;
    for(i=0; i < 5001; i+=increment){
      const result = await axios.post(
        UNI_URL,
        {
          query: `{
           pairs(first: ${increment}, skip: ${i}, orderBy: volumeUSD, orderDirection: desc){
             id
            token0{
              id
            }
            token1{
              id
            }
           }
        }`
        }
      );
      //parse the response as an array
      var array = JSON.parse(JSON.stringify(result.data.data.pairs));
      //for every pair, add the pairID to the map of token0 and token1 {tk1: {tk2: pairid}, tk3: {tk4: pairid}}
      for(j = 0; j < increment; j++ ){
        //create key if it's not already in the map
        var token0Id = array[j].token0.id;
        var token1Id = array[j].token1.id;
        var pairId = array[j].id;
        if(keyTokens.includes(token0Id)){
          if(pairsMap.has(token0Id) == false){
            pairsMap.set(token0Id, new Map());
          }
          pairsMap.get(token0Id).set(token1Id, pairId);
        }
        if(keyTokens.includes(token1Id)){
          if(pairsMap.has(token1Id) == false){
            pairsMap.set(token1Id, new Map());
          }
          pairsMap.get(token1Id).set(token0Id, pairId);
        }

      }
    }

    //TRANSFORM MAP INTO JSON
    var myJson = {};
    myJson.pairs = mapToObj(pairsMap);
    var json = JSON.stringify(myJson);

    fs.writeFile('Output.json', json, (err) => {
        // In case of a error throw err.
        if (err) throw err;
    });

  }catch(error){
    console.error('Error in computing All Pairs', error);
  }
}

computeAllPairs();
// Write data in 'Output.txt' .
