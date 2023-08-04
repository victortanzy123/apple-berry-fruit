import {Contract} from 'ethers';
import hre, {ethers} from 'hardhat';
import {unhexify} from '../../helpers/misc';
import {
  SEPOLIA_NETWORK_ID,
  ERC6551_REGISTRY_SEPOLIA,
  EXAMPLE_721_SEPOLIA,
  BASE_ERC6551_ACCOUNT_IMPLEMENTATION,
} from '../utils/const';

import {getCounterFactualAddress} from '../utils/erc6551-related';

// Deployment Helpers:
import {getContractAt, deploy, deployUUPSUpgradableContract, upgradeUUPSUpgradeableContract} from '../utils/helpers';
// ABI
import {BaseERC6551Account, ContractAccountFactory, ERC6551Registry, ExampleERC721} from '../../typechain-types';

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  // await deploy<ERC6551Registry>(deployer, "ERC6551Registry", [], true);

  // const exampleErc721 = await deploy<ExampleERC721>(deployer, "ExampleERC721", ["WenMoon", "WenMoon Collection"], true);
  // const mintTx = await exampleErc721.mint("TEST_URI");
  // console.log("Mint Tx", mintTx)
  // const latestTokenId = await exampleErc721.totalSupply();
  // console.log("Latest Token Id", latestTokenId)

  const exampleErc721 = await getContractAt<Contract>('ExampleERC721', EXAMPLE_721_SEPOLIA);

  const registry = await getContractAt<Contract>('ERC6551Registry', ERC6551_REGISTRY_SEPOLIA);

  // const createAccountTx = await registry.connect(deployer).createAccount(registry.address, SEPOLIA_NETWORK_ID, exampleErc721.address, 0, 0, "0x");
  // console.log("Create Account Tx for 727", createAccountTx);
  // const address = await getCounterFactualAddress(0, EXAMPLE_721_SEPOLIA, SEPOLIA_NETWORK_ID)
  // await verifyContract(address, []);
  // await deploy<ContractAccountFactory>(deployer, "ContractAccountFactory", ["0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"], true);

  // const registry = await getContractAt<Contract>('ERC6551Registry', ERC6551_REGISTRY_SEPOLIA);

  // const implementationBaseErc6551AccountContract = await deploy<BaseERC6551Account>(deployer, "BaseERC6551Account", [], true);
  // console.log("MOCK Implementation contract", implementationBaseErc6551AccountContract.address);

  // const erc721 = await getContractAt<ExampleERC721>("ExampleERC721", EXAMPLE_721_SEPOLIA);
  // const mint2Tx = await erc721.connect(deployer).mint("BASE_URI_2");
  // console.log('Minting Token ID 1:', mint2Tx);

  const counterFactualAddress = await getCounterFactualAddress(
    1,
    EXAMPLE_721_SEPOLIA,
    SEPOLIA_NETWORK_ID,
    BASE_ERC6551_ACCOUNT_IMPLEMENTATION,
  );

  // const accountCreatedTx = await registry.connect(deployer).createAccount(BASE_ERC6551_ACCOUNT_IMPLEMENTATION, SEPOLIA_NETWORK_ID, EXAMPLE_721_SEPOLIA, 1, 0, "0x");
  // console.log("Account Creation Tx:", accountCreatedTx);

  // await accountCreatedTx.wait();
  const implementationContract = await getContractAt<BaseERC6551Account>('BaseERC6551Account', counterFactualAddress);

  const tokenDetails = await implementationContract.token();
  console.log('See Token Details', tokenDetails);
  const owner = await implementationContract.owner();
  console.log('See Owner', owner);

  const EXAMPLE_ERC721_ABI = ['function mint(string memory uri) external returns (uint256)'];
  const exampleErc721Interface = new ethers.utils.Interface(EXAMPLE_ERC721_ABI);
  const mintTxCallData = exampleErc721Interface.encodeFunctionData('mint', ['BASE_URI_3']);

  // Get the ERC6551Account to execute mint function
  const mint3Tx = await implementationContract
    .connect(deployer)
    .callStatic.execute(EXAMPLE_721_SEPOLIA, 0, mintTxCallData, 0);
  console.log(
    `[CALLSTATIC] Counter Factual Address - ${counterFactualAddress} is minting token on ExampleERC721 Contract...`,
  );
  console.log('See mint3Tx', unhexify(mint3Tx.toString()));

  const mintTx = await implementationContract.connect(deployer).execute(EXAMPLE_721_SEPOLIA, 0, mintTxCallData, 0);
  console.log(
    `[ONGOING TRANSACTION] Counter Factual Address - ${counterFactualAddress} is minting token on ExampleERC721 Contract...`,
  );
  const res = await mintTx.wait();
  console.log('See minted Tx', res);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
