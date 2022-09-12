const Web3 = require("Web3");
const axios = require("axios");

//const REST_ENDPIONT = "https://mainnet.infura.io/v3/7e3566b4933746e288a99e9787131405"
//const ENDPOINT = "wss://mainnet.infura.io/ws/v3/7e3566b4933746e288a99e9787131405";
const REST_ENDPIONT = "http://localhost:8545"
const ENDPOINT = "ws://localhost:3334";

let web3 = new Web3(ENDPOINT);

var subscription = web3.eth.subscribe('newBlockHeaders', function(error, result){
    if (!error) {
        console.log(result);

        return;
    }

    console.error(error);
})
.on("connected", function(subscriptionId){
    console.log(subscriptionId);
})
.on("data", function(blockHeader){
    console.log("block data:")
    console.log(blockHeader.hash);
    
    headers = {"Content-Type":"application/json"}
    data = {"jsonrpc":"2.0", "method":"eth_getBlockByHash","params": [blockHeader.hash,false],"id":1}
    axios({
        method: 'post',
        url: REST_ENDPIONT,
        data: data,
        headers: headers
    })
    .then(response => {
        console.log(response.data.result.transactions)
    })
    .catch(error => {
        element.parentElement.innerHTML = `Error: ${error.message}`;
        console.error('There was an error!', error);
    });
})
.on("error", console.error);

// unsubscribes the subscription
//subscription.unsubscribe(function(error, success){
//    if (success) {
//        console.log('Successfully unsubscribed!');
//    }
//});