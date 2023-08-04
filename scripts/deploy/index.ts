import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {BigNumber, Contract} from 'ethers';
import hre from "hardhat";
import {NULL_ADDRESS} from "../../helpers/const";

// ABI
import { BaseERC6551Account, ContractAccountFactory, ERC6551Registry, ExampleERC721 } from "../../typechain-types"

export async function getContractAt<CType extends Contract>(abiType: string, address: string) {
  return (await hre.ethers.getContractAt(abiType, address)) as CType;
}

export async function verifyContract(contract: string, constructor: any[]) {
  await hre.run('verify:verify', {
    address: contract,
    constructorArguments: constructor,
  });
}

function toWei(amount: number, decimal: number) {
  return BigNumber.from(10).pow(decimal).mul(amount);
}

export async function _impersonateAccount(address: string) {
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [address],
  });
}

export async function impersonateSomeone(user: string) {
  await _impersonateAccount(user);
  return await hre.ethers.getSigner(user);
}

export async function getEth(user: string) {
  await hre.network.provider.send('hardhat_setBalance', [user, '0x56bc75e2d63100000000000000']);
}

export async function deploy<CType extends Contract>(
  deployer: SignerWithAddress,
  abiType: string,
  args: any[],
  verify?: boolean,
  name?: string
) {
  name = name || abiType;
  console.log(`Deploying ${name}...`);
  const contractFactory = await hre.ethers.getContractFactory(abiType);
  //   const contract = await hre.upgrades.deployProxy(contractFactory)
  const contract = await contractFactory.connect(deployer).deploy(...args);
  await contract.deployed();
  console.log(`${name} deployed at address: ${(await contract).address}`);

  // Wait 1 minute before verifying on etherscan
  console.log('Awaiting sufficient block confirmation on the network...');

  if (verify === true) {
    await timeout(60000);
    await verifyContract(contract.address, args);
  }

  return contract as CType;
}

const timeout = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const sleep = async (fx, ...args) => {
  await timeout(60000);
  return fx(...args);
};

/*
3 Types of Proxy Patterns:

1. Diamond Pattern (EIP-2532)

An upgradeable proxy pattern in which there are multiple logic contracts (facets) instead of one. Whenever a function is called in the diamond proxy contract, it checks the hash table (mapping) to see which facet has the function defined and then delegates the call to that facet. This delegatecall occurs in the proxy’s fallback() method. We can add or remove any number of methods from any facet in a single transaction using a method called diamondCut(). In order to avoid storage collisions, this pattern uses the DiamondStorage technique. It also allows the developers to implement logic in facets, independent of other facets.


2. Transparent Proxy Pattern

The logic layer (i.e., the implementation contract) is separated from the storage layer (i.e., the proxy contract) and all calls to the proxy contract are delegated to the logic contract.

This method worked just fine until It was fine until a malicious backdoor, proxy selector clashing, was identified and addressed. Proxy selector clashing occurs when two or more methods have identical function signatures in the proxy and logic contract. This can lead to smart contract exploits.

To resolve the clashing, OpenZeppelin introduced the transparent proxy pattern. This pattern allows identical function signatures to exist in the proxy and logic contract, but the delegatecall to the logic contract only occurs if the caller is not a contract admin. Otherwise, the function is invoked in the proxy contract itself if it exists or reverts if not.


3. UUPS Proxy Pattern

The UUPS proxy pattern is similar to the transparent proxy pattern, except the upgrade is triggered via the logic contract rather than from the proxy contract.

There is a unique storage slot in the proxy contract to store the address of the logic contract that it points to. Whenever the logic contract is upgraded, that storage slot is updated with the new logic contract address. The function to upgrade the contracts should be a protected function to avoid unauthorized access. Also, this provides the ability to go completely non-upgradeable gradually as the logic contract can completely remove the upgradeTo() method in the new implementation if needed.

*/

/// Deployment Function for UUPS Proxy (EIP-1822)
/// returning the address of the proxy, casted to the implementation type
export async function deployUUPSUpgradableContract<CType extends Contract>(
  deployer: SignerWithAddress,
  abiType: string,
  constructor: any[],
  initializer: any[],
  verify?: boolean,
  name?: string
): Promise<{
  implementation: CType;
  proxy: CType;
}> {
  name = name || abiType;
  console.log(`Deploying ${name}-implementation...`);
  const implementationFactory = await hre.ethers.getContractFactory(abiType);
  const implementation = await implementationFactory.connect(deployer).deploy(...constructor);
  await implementation.deployed();
  console.log(`${name}-implementation deployed at address: ${(await implementation).address}`);

  let initializeTx = await implementation.populateTransaction.initialize(...initializer);

  console.log(`Deploying ${name}-proxy...`);
  const proxyFactory = await hre.ethers.getContractFactory('ERC1967Proxy');
  const proxy = await proxyFactory.deploy(implementation.address, initializeTx.data!);
  console.log(`${name}-proxy deployed at address: ${(await proxy).address}`);

  if (verify === true) {
    console.log('Awaiting sufficient block confirmations before verifying...');
    await timeout(60000);
    console.log(`Verifying ${name}-implementation contract at ${(await implementation).address}...`);
    await verifyContract(implementation.address, constructor);

    console.log(`Verifying ${name}-proxy at ${proxy.address}`);
    await verifyContract(proxy.address, [implementation.address, initializeTx.data!]);
  }

  return {
    implementation: implementation as CType,
    proxy: await getContractAt<CType>(abiType, proxy.address),
  };
}

export async function upgradeUUPSUpgradeableContract<CType extends Contract>(
  deployer: SignerWithAddress,
  abiType: string,
  proxyAddress: string,
  oldImplementationAddress: string,
  verify?: boolean,
  name?: string
): Promise<{
  newImplementation: CType;
  proxy: CType;
}> {
  name = name || abiType;
  console.log(`Deploying Updated ${name}-implementation for proxy ${proxyAddress}`);

  const newImplementationFactory = await hre.ethers.getContractFactory(abiType);
  const newImplementation = await newImplementationFactory.connect(deployer).deploy(); // Check if need constructor
  await newImplementation.deployed();

  console.log(`New ${name}-implementation deployed at address: ${(await newImplementation).address}`);

  // const proxyContract = await hre.ethers.getContractAt("ERC1967Proxy", proxyAddress);

  const oldImplementationContract = await hre.ethers.getContractAt('NiftyzoneMarketplace', oldImplementationAddress);

  const upgradeTx = await oldImplementationContract.upgradeTo((await newImplementation).address);

  await upgradeTx.wait();

  return {
    newImplementation: newImplementation as CType,
    proxy: await getContractAt<CType>(abiType, proxyAddress),
  };
}

const ERC6551_REGISTRY_SEPOLIA: string = "0x472EB832b3228F42BB758ADE8f62dAeB6B548f4a"
const EXAMPLE_721_SEPOLIA: string = "0x6D748988935008e9cB7F2c8Fd7dCa0E54BFa6e7D"
const SEPOLIA_NETWORK_ID = 11155111
const BASE_ERC6551_ACCOUNT_IMPLEMENTATION: string = "0xf46e3b69cadE327915b7cE6da7AA64624303c83e"


export async function getCounterFactualAddress(tokenId: number, tokenContract: string, chainId: number, implementationAddress: string): Promise<string> {
  const registry = await getContractAt<Contract>('ERC6551Registry', ERC6551_REGISTRY_SEPOLIA);
  const salt: number = 0;

  const counterFactualAddress = await registry.account(implementationAddress, chainId, tokenContract, tokenId, salt)
  console.log(`Counter Factual Address: ${counterFactualAddress}`);
  return counterFactualAddress;
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  // await deploy<ERC6551Registry>(deployer, "ERC6551Registry", [], true);


  // const exampleErc721 = await deploy<ExampleERC721>(deployer, "ExampleERC721", ["WenMoon", "WenMoon Collection"], true);
  // const mintTx = await exampleErc721.mint("TEST_URI");
  // console.log("Mint Tx", mintTx)
  // const latestTokenId = await exampleErc721.totalSupply();
  // console.log("Latest Token Id", latestTokenId)

  // const exampleErc721 = await getContractAt<Contract>("ExampleERC721", EXAMPLE_721_SEPOLIA);

  // const registry = await getContractAt<Contract>('ERC6551Registry', ERC6551_REGISTRY_SEPOLIA);

  // const createAccountTx = await registry.connect(deployer).createAccount(registry.address, SEPOLIA_NETWORK_ID, exampleErc721.address, 0, 0, "0x");
  // console.log("Create Account Tx for 727", createAccountTx);
  // const address = await getCounterFactualAddress(0, EXAMPLE_721_SEPOLIA, SEPOLIA_NETWORK_ID)
  // await verifyContract(address, []);
  // await deploy<ContractAccountFactory>(deployer, "ContractAccountFactory", ["0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"], true);

  // const registry = await getContractAt<Contract>('ERC6551Registry', ERC6551_REGISTRY_SEPOLIA);

  // const implementationBaseErc6551AccountContract = await deploy<BaseERC6551Account>(deployer, "BaseERC6551Account", [], true);
  // console.log("MOCK Implementation contract", implementationBaseErc6551AccountContract.address);

  const counterFactualAddress = await getCounterFactualAddress(0, EXAMPLE_721_SEPOLIA, SEPOLIA_NETWORK_ID, BASE_ERC6551_ACCOUNT_IMPLEMENTATION);

  // const accountCreatedTx = await registry.connect(deployer).createAccount(implementationBaseErc6551AccountContract.address, SEPOLIA_NETWORK_ID, EXAMPLE_721_SEPOLIA, 0, 0, "0x");
  // console.log("Account Creation Tx:", accountCreatedTx);
  const implementationContract = await getContractAt<BaseERC6551Account>("BaseERC6551Account", counterFactualAddress);

  const tokenDetails = await implementationContract.token();
  console.log("See Token Details", tokenDetails)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
