// App.js
import React, { useEffect, useState } from "react";
import './App.css';
/* ethers 変数を使えるようにする */
import { ethers } from "ethers";
// ethers の様々なクラスや関数は、ethersprojectが提供するサブパッケージからインポートすることができる
//    -> WEBアプリからコントラクトを呼び出す時に必須となる
/* ABIファイルを含むWavePortal.jsonファイルをインポートする */
import abi from "./utils/WavePortal.json";

const App = () => {
  /*ユーザーの情報を保存するために使用する変数と関数を定義し、初期化している ここから... */
  /* ユーザーがパブリックウォレットを保存するために使用する状態変数を定義します */
  const [currentAccount, setCurrentAccount] = useState("");
  //    -> ユーザーのパブリックウォレットを格納する数(= currentAccount)
  //    ->  ユーザーのパブリックウォレットを更新する関数(= setCurrentAccount)

  /* ユーザーのメッセージを保持するために使用する状態変数を定義 */
  const [messageValue, setMessageValue] = useState("");
  //    -> ユーザーのメッセージを格納する変数(= messageValue)
  //    -> ユーザーのメッセージを更新する関数(= setMessageValue)

  /* 全てのwavesを保存する状態変数を定義 */
  const [allWaves, setAllWaves] = useState([]);
  //    -> 現在のwavesの状態を格納する変数(= allWaves)
  //    -> 現在のwavesの状態を更新する関数(= setAllWaves)

  /* ...ここまで */

  /* この段階で currentAccount の中身は空 */
  // アクセス可能なアカウントを検出した後、currentAccount にユーザーのウォレットアカウント(0x...)の値が入る
  console.log("currentAccount: ", currentAccount);

  /* デプロイされたコントラクトのアドレスを保持する変数を作成 */
  const contractAddress = "0x04bDEC5C41616Fa68eF3EBBdf7E92C31948358c7";

  /* ABIの内容を参照する変数を作成 */
  const contractABI = abi.abi;

  const getAllWaves = async () => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        // ここでは、provider(= MetaMask) を設定している
        //    -> これにより、フロントエンドがMetaMaskを介して、イーサリアムノードに接続できるようになる
        const signer = provider.getSigner();
        // ここでは、ユーザーのウォレットアドレス(= signer)を設定している
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        // ここでは、コンストラクトのインスタンス(= wavePortalContract)を生成し、コントラクトへの接続を行っている
        // wave関数同様、コントラクトの新しいインスタンスを作成するには、以下の3つをethers.Contract関数に渡す必要がある
        //    -> 1.コントラクトのデプロイ先のアドレス(ローカル、テストネット、またはイーサリアムネット)
        //    -> 2.コントラクトのABI
        //    -> 3.provider、もしくはsigner
        // 今回は、signerを引数として渡しているので、wavePortalContractインスタンスは「読み取り」と「書き込み」の両方の機能が使えるようになる

        /* コントラクトからgetAllWavesメソッドを呼び出す */
        const waves = await wavePortalContract.getAllWaves();

        /* ここでは状態変数(= waveCleaned)に、mapメソッドを使って、データを追加している ここから... */
        /* UIに必要なのは、アドレス、タイムスタンプ、メッセージだけなので、以下のように設定 */
        const wavesCleaned = waves.map(wave => {
          // mapメソッドは、元となる配列から新しく配列を作るためのメソッド
          // 配列の全ての要素に対して、与えられた関数を実行し、関数で返された値で新しい配列を生成する
          // mapメソッドによって下記のデータが、wavesCleanedに格納される
          //    -> waveしたユーザーのアドレス(=address)
          //    -> 送信した時間(= timestamp)
          //    -> 付随するメッセージ(= message)
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          };
        });
        // ここでは.map()メソッドを使用してwaves配列をループし、配列内の各項目の要素を返している
        // 今回返す要素は、以下の通り
        //    -> address : waveしたユーザーのアドレス
        //    -> timestamp : waveのタイムスタンプ
        //    -> message : waveと共に送信されたメッセージ

        /* React Stateにデータを格納する*/
        setAllWaves(wavesCleaned);
        // これで、新しいwaveの情報がwaves変数に新たな配列として追加される

        /* ...ここまで */

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  /*
    'emit'されたイベントに反応する
  */
  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };
    // ここでは下記の2つの動作を実行している
    //    -> コントラクト側で新しくNewWaveイベントがemitされた時、下記の情報を取得する
    //        -> senderのアドレス
    //        -> senderがNewWaveをemitしたときのタイムスタンプ
    //        -> messageの内容
    //       上記のコードを実装することにより、フロントエンドからそれらのデータにアクセスできるようになる
    //    -> NewWaveイベントをフロントエンドが受け取った時にsetAllWavesを実行する
    //        -> NewWaveイベントがemitされた際に、上記で取得したユーザーに関する3つの情報がallWaves配列に追加される
    //        -> これにより、WEBアプリのフロントエンドに反映するデータを自動で更新できるようになる
    // このOnNewWave関数は、NewWaveのイベントリスナーの働きをしている
    //    -> イベントリスナーとは「ページが表示された」、「ボタンをクリックした」などの動作のことを表す
    //        -> ここでは、「フロントエンドでユーザーが wave を送った」動作を受け取る
    //        -> Javascriptでは、フロントエンドでイベントが発生した際に動作するように対応付けておいた関数のことを「イベントリスナー」と呼ぶ

    /* NewWaveイベントがコントラクトから発信されたときに、情報を受ける */
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

      wavePortalContract.on("NewWave", onNewWave);
      // wavePortalContract.on("NewWave", onNewWave)により、上記で定義した onNewWave が呼び出される
    }

    /* メモリリークを防ぐために、NewWaveのイベントを解除します */
    return () => {
      if (wavePortalContract) {

        wavePortalContract.off("NewWave", onNewWave);
        // wavePortalContract.on("NewWave", onNewWave)により、フロントエンドは、NewWaveイベントがコントラクトから発信されたときに、情報を受け取る
        //    -> これにより、情報がフロントエンドに反映される
        //    -> このことを、コンポーネント(情報)がマウント(フロントエンドに反映)されると言う
        // コンポーネントがマウントされる状態をそのままにしておくと、メモリリーク(コンピュータを動作させている内に、使用可能なメモリの容量が減っていってしまう現象)が発生する可能性がある
        // メモリリークを防ぐために、wavePortalContract.off("NewWave", onNewWave)では、onNewWave関数の稼働を止めている
        //    -> これは、イベントリスナーを止めることを意味している
      }
    };
  }, []);

  /* window.ethereum にアクセスできることを確認します */
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log("Make sure you have MetaMask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      /* ユーザーのウォレットへのアクセスが許可されているかどうかを確認します */
      // accounts にWEBサイトを訪れたユーザーのウォレットアカウントを格納する(複数持っている場合も加味、よって account's' と変数を定義している)
      const accounts = await ethereum.request({ method: "eth_accounts" });
      // eth_accounts は、空の配列または単一のアカウントアドレスを含む配列を返す特別なメソッド

      /* もしアカウントが1つでも存在したら、以下を実行 */
      /* ユーザーのウォレットアカウントへのアクセスが許可されている場合は、Found an authorized account とコンソールに出力される*/
      if (accounts.length !== 0) {
        const account = accounts[0];
        // account という変数にユーザーの一つ目(=Javascriptでいう0番目)のアドレスを格納
        console.log("Found an authorized account:", account);
        /* currentAccount にユーザーのアカウントアドレスを格納 */
        setCurrentAccount(account)
        getAllWaves();
      } else {
        /* アカウントが存在しない場合は、エラーを出力 */
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  }

  /* connectWallet メソッドを実装 */
  //    -> eth_requestAccounts関数を使用することで、MetaMaskからユーザーにウォレットへのアクセスを許可するよう呼び掛けることができる
  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      console.log("Connected: ", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  // waveの回数をカウントする関数を実装
  const wave = async () => {
    try {
      // ユーザーがMetaMaskを持っているか確認
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        // ここでは、provider(=MetaMask)を設定している
        // provider を介して、ユーザーはブロックチェーン上に存在するイーサリアムノードに接続することができる
        // MetaMaskが提供するイーサリアムノードを使用して、デプロイされたコントラクトからデータを送受信するために上記の実装を行った
        // ethers のライブラリにより provider のインスタンスを新規作成
        const signer = provider.getSigner();
        // singer は、ユーザーのウォレットアドレスを抽象化したもの
        // provider を作成し、provider.getSigner() を呼び出すだけで、ユーザーはウォレットアドレスを使用してトランザクションに署名し、そのデータをイーサリアムネットワークに送信することができる
        // provider.getSinger() は、新しい signer インスタンスを返すので、それを使って署名付きトランザクションを送信することができる

        /* ABIを参照 */
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        // コントラクトへの接続を行っている
        // コントラクトの新しいインスタンスを制作するには、以下の３つの変数を ethers.Contract 関数に渡す必要がある
        //    -> コントラクトのデプロイ先のアドレス(ローカル、テストネット、またはイーサリアムネット)
        //    -> コントラクトのABI
        //    -> provider もしくは signer
        // コントラクトインスタンスでは、コントラクトに格納されている全ての関数を呼び出すことができる
        // もしこのコントラクトインスタンスに provider を渡すと、そのインスタンスは読み取り専用の機能しか実行できなくなる
        // 一方、signer を渡すと、そのインスタンスは読み取りと書き込みの両方の機能を実行できるようになります

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        let contractBalance = await provider.getBalance(
          wavePortalContract.address
        );
        console.log(
          "Contract balance:",
          ethers.utils.formatEther(contractBalance)
        );

        /* コントラクトにwaveを書き込む。 ここから... */
        const waveTxn = await wavePortalContract.wave(messageValue, { gasLimit: 300000 });
        // gasLimitは、「ガス量」の最大値(上限)を設定するためのパラメーター
        // これは、送金先のプログラムの問題などで、ずっと処理が実行され続けて、送金手数料の支払いが無限に発生する(「ガス量」が無限に大きくなる)ことを防ぐためのもの
        // ガス量がgasLimitで設定された数値以上になった場合は処理を中断して、それ以上の送金手数料が発生しないような仕組みになっている
        //    -> つまり、送金手数料として支払う最大値(上限)は、下記のようになります。
        //            -> 最大送金手数料(ETH) = ガス価格 × ガスリミット

        console.log("Mining...", waveTxn.hash);
        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);
        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        /* ここまで */

        let contractBalance_post = await provider.getBalance(wavePortalContract.address);
        /* コントラクトの残高が減っていることを確認 */
        if (contractBalance_post < contractBalance) {
          /* 減っていたら下記を出力 */
          console.log("User won ETH!");
        } else {
          console.log("User didn't win ETH.");
        }
        console.log(
          "Contract balance after wave:",
          ethers.utils.formatEther(contractBalance_post)
        );
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  /* WEBページがロードされたときに下記の関数を実行します */
  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  return (
    <div className="mainContainer">
      <div className="dataContainer">

        <div className="header">
          <span role="img" aria-label="hand-wave">👋</span> WELCOME!
        </div>

        <div className="bio">
          イーサリアムウォレットを接続して、メッセージを作成したら、<span role="img" aria-label="hand-wave">👋</span>を送ってください<span role="img" aria-label="shine">✨</span>
        </div>

        {/* メッセージボックスを実装 */}
        {currentAccount && (<textarea name="messageArea"
          placeholder="メッセージはこちら"
          type="text"
          id="message"
          value={messageValue}
          onChange={e => setMessageValue(e.target.value)} />)
          // これは、認証済みのアドレス(= currentAccount)が存在する場合に、テキストボックスをUIに表示する仕様になっている
          // これで、ユーザーは、UIから直接メッセージを書き込めるようになる
        }

        <br />
        {/* ウォレットコネクトのボタンを実装 */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet} >
            Connect Wallet
          </button>
        )}
        {currentAccount && (
          <button className="waveButton">
            Wallet Connected
          </button>
        )}

        {/* waveボタンにwave関数を連動させる */}
        {currentAccount && (
          <button className="waveButton" onClick={wave}>
            Wave at Me
          </button>)
        }
        {/* onClick プロップをnullからwaveに更新して、wave() 関数を waveButton に接続している */}

        {/* 履歴を表示する */}
        {currentAccount && (
          allWaves.slice(0).reverse().map((wave, index) => {
            return (
              <div key={index} style={{ backgroundColor: "#F8F8FF", marginTop: "16px", padding: "8px" }}>
                <div>Address: {wave.address}</div>
                <div>Time: {wave.timestamp.toString()}</div>
                <div>Message: {wave.message}</div>
              </div>)
          })
        )}
      </div>
    </div>
  );
}

export default App

/*
ABI (Application Binary Interface) はコントラクトの取り扱い説明書のようなもの

WEBアプリがコントラクトと通信するために必要な情報が、ABI ファイルに含まれています。

コントラクト一つ一つにユニークな ABI ファイルが紐づいており、その中には下記の情報が含まれている

  -> そのコントラクトに使用されている関数の名前
  -> それぞれの関数にアクセスするために必要なパラメータとその型
  -> 関数の実行結果に対して返るデータ型の種類

ABI ファイルは、コントラクトがコンパイルされた時に生成され、artifacts ディレクトリに自動的に格納される
*/


/*
コントラクトにデータを書き込むコードは、データを読み込むコードに似ている

主な違いは、コントラクトに新しいデータを書き込むときは、マイナーに通知が送られ、
そのトランザクションの承認が求めらること

データを読み込むときは、そのようなことをする必要はない
よって、ブロックチェーンからのデータの読み取りは無料
*/


/*
ガス価格とは

送金手数料を決める、もう1つのパラメータが「ガス価格」
ガス価格は、1Gas当たりの価格を意味します
基本的な1Gas当たりの価格は「21 Gwei」で送金される
ガス価格の単位として使われている「wei」と、イーサリアムの単位の関係は検索
(1ETH = 1000000000000000000wei)
Gはギガのことで、1Gwei = 0.000000001ETH
ガス価格は、送金者が自由に設定することができる
マイナーは、ガス価格が高い(= マイニング報酬が多い)トランザクションを優先的に承認する
    -> ガス価格を高く設定しておくと、送金が早くなる傾向がある
*/