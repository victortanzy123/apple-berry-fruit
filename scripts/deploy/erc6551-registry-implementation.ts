import hre, {ethers} from 'hardhat';
// Deployment Helpers:
import {deploy} from '../utils/helpers';
// ABI
import {BaseERC6551Account, ERC6551Registry} from '../../typechain-types';

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const registry = await deploy<ERC6551Registry>(deployer, 'ERC6551Registry', [], true);

  // Setting up Implementation Contract via deploying a mock base implementation owned by no one.
  const implementationBaseErc6551AccountContract = await deploy<BaseERC6551Account>(
    deployer,
    'BaseERC6551Account',
    [],
    true,
  );
  console.log('[SET-UP] Implementation contract', implementationBaseErc6551AccountContract.address);

  // Save `implementationBaseErc6551AccountContract.address` as a constant variable since its needed as an input param to manufacture Base6551Account for NFTs.
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
