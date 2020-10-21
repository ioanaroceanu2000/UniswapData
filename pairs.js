const axios = require('axios');
const fs = require('fs') ;
const UNI_URL = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2';

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
    const increment = 100;
    for(i=0; i < 1600; i+=increment){
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
        if(pairsMap.has(token0Id) == false){
          pairsMap.set(token0Id, new Map());
        }
        if(pairsMap.has(token1Id) == false){
          pairsMap.set(token1Id, new Map());
        }
        pairsMap.get(token0Id).set(token1Id, pairId);
        pairsMap.get(token1Id).set(token0Id, pairId);
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
