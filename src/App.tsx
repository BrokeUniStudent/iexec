import { useSDK } from "@metamask/sdk-react";
import React, { useState, useEffect } from "react";
import {
  IExecDataProtectorSharing,
  IExecDataProtectorCore,
  ProtectedDataInCollection,
  SubscriptionParams,
} from '@iexec/dataprotector';
import { Survey, SurveyProps, SurveyQuestionTypes, FormParams } from "./types";

let dataProtectorCore: IExecDataProtectorCore;
let dataProtectorSharing: IExecDataProtectorSharing;
let data:ProtectedDataInCollection[];

const IExecDataDeliveryApp = '0x1cb7D4F3FFa203F211e57357D759321C6CE49921'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'


// data to protect. you can ignore for debugging
export const exampleForm: FormParams[] = [
  [
      SurveyQuestionTypes.scale,
      {
          question: 'How important is dress code in your choice of employer?',
          labels: ['very important', 'important', 'neutral', 'unimportant', 'very unimportant']
      }
  ],
  [
      SurveyQuestionTypes.selection,
      {
          question: 'Which of these have you visited in the last month (tick all that apply)',
          selection: ['Cinema', 'Restaurant', 'Leisure centre', 'Gallery', 'Concert venue'],
          minSelections: 0,
          maxSelections: 5
      }
  ],
  [
      SurveyQuestionTypes.text,
      {
          question: 'What matters most to you in the workplace?',
          maxWordCount: 500
      }
  ]
]

const defaultSurveyList:Survey[] = [
  {
      title: 'A survey for LLMA/ERA usage',
      date: '11/11/2023',
      description:
          'What are your views on LLMA/ERA?',
      reviewResult: 0
  },
  {
      title: 'How can we improve the current national healthcare system?',
      date: '10/12/2023',
      description:
          'We want to hear your views!',
      reviewResult: 0
  },
];
// data ends

export const App = () => {
  const [account, setAccount] = useState<string>();
  const [address, setAddress] = useState<number | string>('0x29a634a2bed4346fce5e3ef9ff647844cc9f1375');
  const [data, setData] = useState<string>();
  const [collectionId, setColletionId] = useState<number>(336);
  const { sdk, connected, connecting, provider, chainId } = useSDK();

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
      // Instantiate only the Core module for read-only core methods
      dataProtectorCore = new IExecDataProtectorCore(provider);
      // Instantiate only the Sharing module for read-only sharing methods
      dataProtectorSharing = new IExecDataProtectorSharing(provider);
    }
  }, [connected])

  const uploadData = async() => {
    let {address} = await dataProtectorCore.protectData(
      {
        name: defaultSurveyList[0].title,
        data: {formParams: JSON.stringify(exampleForm)},
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
    await dataProtectorSharing.removeCollection({collectionId: collectionId})
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
    console.log(protectedDataInCollection.map(data => data.id))
    console.log(protectedDataInCollection.find(data => data.id === address.toString()))
    return protectedDataInCollection.find(data => data.id == address)
  }

  const removeFromCollection = async () => {
    await dataProtectorSharing.removeProtectedDataFromCollection({protectedData: address.toString()})
  }

  const getData = async() =>{
    // await dataProtectorSharing.subscribeToCollection({collectionId: collectionId, price: 0, duration: 1000000000000})
    await dataProtectorSharing.buyProtectedData({protectedData: address.toString(), price: 0})
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
          
          <button onClick={()=>getData()}>
            data from iexec sidechain {JSON.stringify(data)}
          </button>
        </div>
      )}
    </div>
  );
};

export default App;