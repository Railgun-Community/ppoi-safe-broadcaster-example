import debug from "debug";
import { ABI_ERC20, ABI_PERMIT2 } from "../abi/abi";
import { Contract, ContractTransaction, FallbackProvider } from "ethers";
import { RelayerChain } from "../../models/chain-models";
import { ERC20Amount } from "../../models/token-models";
import { uniswapPermit2ContractAddress } from "../api/uniswap/uniswap-quote";

const dbg = debug('relayer:approvals');

export const MAX_UINT_ALLOWANCE = 2n ** 256n - 1n;
export async function populateUniswapApprovalTransactions(
  tokenAmount: ERC20Amount,
  provider: FallbackProvider,
  chain: RelayerChain,
  sender: string,
  spender: string
): Promise<ContractTransaction[]> {
  const populatedTransactions: ContractTransaction[] = [];
  try {
    const contract = new Contract(
      tokenAmount.tokenAddress,
      ABI_ERC20,
      provider
    );
    // sellToken approval to permit contract, for sellAmount
    // permit2 approval to QUOTE:to for MAX_U160_ALLOWANCE, MAX_U48_ALLOWANCE for timestamp timeout
    const permit2Address = uniswapPermit2ContractAddress(chain);
    const universalRouter = spender;

    const permit2Contract = new Contract(
      permit2Address,
      ABI_PERMIT2,
      provider
    );

    // eslint-disable-next-line no-await-in-loop
    const allowance: bigint = await contract.allowance(sender, permit2Address);
    if (allowance < tokenAmount.amount) {
      dbg('Not Enough Allowance granted');
      // eslint-disable-next-line no-await-in-loop
      const populatedTransaction = await contract.approve.populateTransaction(
        permit2Address,
        tokenAmount.amount
      );
      populatedTransaction.from = sender;
      populatedTransactions.push(populatedTransaction);

    }

    // eslint-disable-next-line no-await-in-loop
    const universalAllowance = await permit2Contract.allowance(
      sender,
      tokenAmount.tokenAddress,
      universalRouter
    );
    if (typeof universalAllowance !== 'undefined') {
      if (universalAllowance.amount < tokenAmount.amount) {
        dbg('Not enough allowance for universal router');

        const nowTime = Math.floor(Date.now() / 1000);

        const unit48timeout = nowTime + (10 * 60);
        // eslint-disable-next-line no-await-in-loop
        const populatedPermit2Transaction = await permit2Contract.approve.populateTransaction(
          tokenAmount.tokenAddress,
          universalRouter,
          tokenAmount.amount,
          unit48timeout
        );
        populatedPermit2Transaction.from = sender;
        populatedTransactions.push(populatedPermit2Transaction);

      } else {
        // if we have enough allowance, check the expiration
        const nowTime = Math.floor(Date.now() / 1000);
        if (universalAllowance.expiration < nowTime) {

          const unit48timeout = nowTime + (10 * 60);
          // eslint-disable-next-line no-await-in-loop
          const populatedPermit2Transaction = await permit2Contract.approve.populateTransaction(
            tokenAmount.tokenAddress,
            universalRouter,
            tokenAmount.amount,
            unit48timeout
          );
          populatedPermit2Transaction.from = sender;
          populatedTransactions.push(populatedPermit2Transaction);
        }
      }
    } else {
      throw new Error('Could not get allowance for universal router');
    }
  } catch (err: any) {
    dbg(`Could not populate transaction for some token: ${err.message}`);
  }
  return populatedTransactions;
}



