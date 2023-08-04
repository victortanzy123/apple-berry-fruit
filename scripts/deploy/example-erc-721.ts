import hre, {ethers} from 'hardhat';

// Deployment Helpers:
import {deploy} from '../utils/helpers';
// ABI
import {ExampleERC721} from '../../typechain-types';

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const exampleErc721 = await deploy<ExampleERC721>(
    deployer,
    'ExampleERC721',
    ['WenMoon', 'WenMoon Collection'],
    true,
  );
  const mintTx = await exampleErc721.mint('TEST_URI');
  const res = await mintTx.wait();
  console.log('Mint Tx', mintTx);
  const latestTokenId = await exampleErc721.totalSupply();
  console.log('Latest Token Id', latestTokenId);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
