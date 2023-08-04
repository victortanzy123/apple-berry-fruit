import hre, {ethers} from 'hardhat';
import {unhexify} from '../../helpers/misc';
import {getContractAt} from '../utils/helpers';

import {EXAMPLE_721_SEPOLIA, SEPOLIA_NETWORK_ID, BASE_ERC6551_ACCOUNT_IMPLEMENTATION} from '../utils/const';
import {getCounterFactualAddress} from '../utils/erc6551-related';
// ABI
import {BaseERC6551Account} from '../../typechain-types';

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const counterFactualAddress = await getCounterFactualAddress(
    1,
    EXAMPLE_721_SEPOLIA,
    SEPOLIA_NETWORK_ID,
    BASE_ERC6551_ACCOUNT_IMPLEMENTATION,
  );

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
