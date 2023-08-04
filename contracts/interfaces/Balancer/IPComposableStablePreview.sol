pragma solidity 0.8.17;

import "./IBalancerStablePreview.sol";

interface IPComposableStablePreview is IBalancerStablePreview {
    struct ImmutableData {
        address[] poolTokens;
        address[] rateProviders;
        uint256[] rawScalingFactors;
        bool[] isExemptFromYieldProtocolFee;
        //
        address LP;
        bool noTokensExempt;
        bool allTokensExempt;
        uint256 bptIndex;
        uint256 totalTokens;
    }

    struct TokenRateCache {
        uint256 currentRate;
        uint256 oldRate;
    }
}
