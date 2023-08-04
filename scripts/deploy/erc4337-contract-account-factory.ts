import {Contract} from 'ethers';
import hre, {ethers} from 'hardhat';
import {unhexify} from '../../helpers/misc';
import {SEPOLIA_NETWORK_ID, ERC4337_ENTRY_POINT} from '../utils/const';

import {getCounterFactualAddress} from '../utils/erc4337-related';

// Deployment Helpers:
import {getContractAt, deploy, deployUUPSUpgradableContract, upgradeUUPSUpgradeableContract} from '../utils/helpers';
// ABI
import {ContractAccountFactory, ContractAccount} from '../../typechain-types';

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const contractAccountFactory = await deploy<ContractAccountFactory>(
    deployer,
    'ContractAccountFactory',
    [ERC4337_ENTRY_POINT],
    true,
  );

  // Create an account (counter factual) for `deployer` address
  const contractAccountCreationTx = await contractAccountFactory.connect(deployer).createAccount(deployer.address, 0); // Salt as 0
  await contractAccountCreationTx.wait();

  const counterFactualAddress = await getCounterFactualAddress(deployer.address);

  const deployerContractAccount = await getContractAt<ContractAccount>('ContractAccount', counterFactualAddress);
  const owner = await deployerContractAccount.owner();
  console.log(`Owner of Contract Account created from - ${deployer.address}  -> ${owner}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
