import { useSDK } from "@metamask/sdk-react";
import { useState, useEffect } from "react";
import {
  IExecDataProtectorSharing,
  IExecDataProtectorCore,
} from '@iexec/dataprotector';

let dataProtectorCore: IExecDataProtectorCore;
let dataProtectorSharing: IExecDataProtectorSharing;

const IExecDataDeliveryApp = '0x1cb7D4F3FFa203F211e57357D759321C6CE49921'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export const App = () => {
  // not relevant to debugging til line 39: metamask connection + inital setup
  const [account, setAccount] = useState<string>();
  const [address, setAddress] = useState<number | string>("");
  const [data, setData] = useState<string>();
  const [collectionId, setColletionId] = useState<number>(0);

  const { sdk, connected, provider, chainId } = useSDK();

  const connect = async () => {
    try {
      const accounts = await sdk?.connect();
      setAccount(accounts?.[0]);
    } catch (err) {
      console.warn("failed to connect..", err);
    }
  };

  useEffect(() => {
    if (connected && chainId === '0x86'){
      dataProtectorCore = new IExecDataProtectorCore(provider);
      dataProtectorSharing = new IExecDataProtectorSharing(provider);
    }
  }, [connected])
  
// relevant to debugging
  const uploadData = async() => {
    let {address} = await dataProtectorCore.protectData(
      {
        name: 'example',
        data: {example: 'example'},
        onStatusUpdate: ({ title, isDone }) => {console.log('protect',title, isDone);}
      },
    )
    setAddress(address);

    await dataProtectorCore.grantAccess({
      protectedData: address,
      authorizedApp: IExecDataDeliveryApp,
      authorizedUser: ZERO_ADDRESS,
      pricePerAccess: 0,
      numberOfAccess: 10000000,
      onStatusUpdate: ({ title, isDone }) => {
        console.log(title, isDone);
      },
    });
    return address;
  }

  const createCollection = async () => {
    const response = await dataProtectorSharing.createCollection();
    setColletionId(response.collectionId);
    return collectionId;
  }

  const addToCollection = async() => {
    
    const {txHash}= await dataProtectorSharing.addToCollection({
      collectionId: (collectionId as number), 
      protectedData: (address.toString()), 
      addOnlyAppWhitelist: '0x256bcd881c33bdf9df952f2a0148f27d439f2e64',
      onStatusUpdate: ({ title, isDone }) => { 
        console.log(title, isDone); 
      }
    })
    await dataProtectorSharing.setProtectedDataForSale({protectedData: address.toString(), price:0})
    console.log(txHash)
  }

  const checkIfDataInCollection = async () => {
    const {protectedDataInCollection} = await dataProtectorSharing.getProtectedDataInCollections({collectionId: parseInt(collectionId.toString())});
    console.log(protectedDataInCollection.find(data => data.id === address.toString()))
  }

  const removeFromCollection = async () => {
    await dataProtectorSharing.removeProtectedDataFromCollection({protectedData: address.toString()})
  }

  const buyProtectedData = async() => {
    await dataProtectorSharing.buyProtectedData({protectedData: address.toString(), price: 0})
    console.log('bought')
  }

  const getData = async() =>{
    
    const {result} = await dataProtectorSharing.consumeProtectedData({
      protectedData: address.toString(),
      app: IExecDataDeliveryApp
    })
    setData(new TextDecoder().decode(result));
    return result;
  }

  return (
    <div className="App">
      <button style={{ padding: 10, margin: 10 }} onClick={connect}>
        Connect
      </button>
      {connected && (
        <div>
          <>
            {chainId && `Connected chain: ${chainId}`}
            <p></p>
            {account && `Connected account: ${account}`}
          </>
          <div>
            <button onClick={() => uploadData()}>
              send data to iexec sidechain
            </button>
            <div>address: {address.toString()}</div>
          </div>

          <div>
            <button onClick={() => createCollection()}>
              create a collection
            </button>
            <div>collection id: {collectionId?.toString()}</div>
          </div>

          <div>
            <button onClick={() => checkIfDataInCollection()}>
              checkIfDataInCollection
            </button>
          </div>

          <div>
            <button onClick={() => addToCollection()}>
              add to collection
            </button>
          </div>

          <div>
            <button onClick={() => removeFromCollection()}>
              removeFromCollection
            </button>
          </div>

          <button onClick={()=>buyProtectedData()}>
            buyProtectedData
          </button>
          
          <button onClick={()=>getData()}>
            data from iexec sidechain {JSON.stringify(data)}
          </button>
        </div>
      )}
    </div>
  );
};

export default App;