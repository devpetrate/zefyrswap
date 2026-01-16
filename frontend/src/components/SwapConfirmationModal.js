// SwapConfirmationModal.js
import React from "react";
import "./styles.css";

const SwapConfirmationModal = ({
  isOpen,
  onClose,
  step,
  tokenSymbol,
  approveTxHash,
  swapTxHash,
  error,
  isWrapOrUnwrap,
}) => {
  if (!isOpen) return null;

  //   const getStepIcon = (stepNumber) => {
  //     if (step > stepNumber) {
  //       return <div className="step-icon completed">✓</div>;
  //     } else if (step === stepNumber) {
  //       return <div className="step-icon active">
  //         <div className="spinner"></div>
  //       </div>;
  //     } else {
  //       return <div className="step-icon pending">
  //         <div className="step-number">{stepNumber}</div>
  //       </div>;
  //     }
  //   };

  const getProgressBarClass = (barNumber) => {
    // Step 1-2 = first bar, Step 3-4 = second bar
    if (step === 1 || step === 2) {
      if (barNumber === 1) return "progress-bar active";
      return "progress-bar pending";
    }
    if (step === 3 || step === 4) {
      if (barNumber === 1) return "progress-bar completed";
      if (barNumber === 2) return "progress-bar active";
    }
    return "progress-bar pending";
  };

  const renderContent = () => {
    // Error State
    if (error) {
      return (
        <div className="modal-content">
          <div className="error-icon">✕</div>
          <h2 className="modal-title">Transaction Failed</h2>
          <p className="error-message">{error}</p>
          <button className="done-button" onClick={onClose}>
            Close
          </button>
        </div>
      );
    }

    // Step 1: Approve Token (only for ERC20, not for native ETH or wrap/unwrap)
    if (step === 1) {
      return (
        <div className="modal-content">
          <div className="step-icon-large">
            <div className="token-icon">🔓</div>
          </div>

          <h2 className="modal-title">Swap Confirmation</h2>

          <div className="step-info">
            <span className="step-label">1. Approve {tokenSymbol}</span>
          </div>

          <button className="approve-button disabled">
            <span className="lock-icon">🔒</span>
            Approve
          </button>

          <div className="progress-section">
            <div className={getProgressBarClass(1)}>
              <div className="progress-fill"></div>
            </div>
            <div className={getProgressBarClass(2)}>
              <div className="progress-fill"></div>
            </div>
          </div>

          <p className="wallet-prompt">
            Please approve the token in your wallet.
          </p>
        </div>
      );
    }

    // Step 2: Approving...
    if (step === 2) {
      return (
        <div className="modal-content">
          <div className="step-icon-large">
            <div className="spinner-large"></div>
          </div>

          <h2 className="modal-title">Swap Confirmation</h2>

          <div className="step-info">
            <span className="step-label">1. Approve {tokenSymbol}</span>
          </div>

          <button className="approve-button approving">
            <div className="button-spinner"></div>
            Approving...
          </button>

          <div className="progress-section">
            <div className={getProgressBarClass(1)}>
              <div className="progress-fill"></div>
            </div>
            <div className={getProgressBarClass(2)}>
              <div className="progress-fill"></div>
            </div>
          </div>

          <p className="wallet-prompt">
            Please approve the token in your wallet.
          </p>
        </div>
      );
    }

    // Step 3: Token Approved, Submitting Swap
    if (step === 3) {
      return (
        <div className="modal-content">
          <div className="step-icon-large completed">
            <div className="checkmark">✓</div>
          </div>

          <h2 className="modal-title">Swap Confirmation</h2>

          <div className="step-status">
            <span className="status-label">Token Approved</span>
            {approveTxHash && (
              <a
                href={`https://basescan.org/tx/${approveTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tx-link-large"
              >
                View Approve Txn (0x{approveTxHash.slice(2, 6)}...) ↗
              </a>
            )}
          </div>

          <div className="step-info">
            <span className="step-label">2. Submitting Swap</span>
          </div>

          <div className="progress-section">
            <div className={getProgressBarClass(1)}>
              <div className="progress-fill"></div>
            </div>
            <div className={getProgressBarClass(2)}>
              <div className="progress-fill"></div>
            </div>
          </div>

          <p className="wallet-prompt">
            Confirm the swap transaction in your wallet.
          </p>
        </div>
      );
    }

    // Step 4: Transaction Confirmed
    if (step === 4) {
      return (
        <div className="modal-content success">
          <div className="step-icon-large success">
            <div className="checkmark">✓</div>
          </div>

          <h2 className="modal-title">Transaction Confirmed!</h2>

          <div className="step-info">
            <span className="step-label">2. Submitting Swap</span>
            <div className="step-check">✓</div>
          </div>

          {swapTxHash && (
            <a
              href={`https://basescan.org/tx/${swapTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tx-link-large"
            >
              View Swap Txn (0x{swapTxHash.slice(2, 6)}...) ↗
            </a>
          )}

          <div className="progress-section">
            <div className="progress-bar completed">
              <div className="progress-fill"></div>
            </div>
            <div className="progress-bar completed">
              <div className="progress-fill"></div>
            </div>
          </div>

          <button className="done-button" onClick={onClose}>
            Done
          </button>
        </div>
      );
    }

    // Step 5: Wrap/Unwrap Transaction (single step)
    if (step === 5) {
      const action = isWrapOrUnwrap?.isWrap ? "Wrap" : "Unwrap";
      return (
        <div className="modal-content">
          <div className="step-icon-large">
            <div className="spinner-large"></div>
          </div>

          <h2 className="modal-title">{action} Confirmation</h2>

          <div className="step-info">
            <span className="step-label">1. {action}ping...</span>
          </div>

          <div className="progress-section single">
            <div className="progress-bar active">
              <div className="progress-fill"></div>
            </div>
          </div>

          <p className="wallet-prompt">
            Confirm the {action.toLowerCase()} transaction in your wallet.
          </p>
        </div>
      );
    }

    // Step 6: Wrap/Unwrap Complete
    if (step === 6) {
      const action = isWrapOrUnwrap?.isWrap ? "Wrap" : "Unwrap";
      return (
        <div className="modal-content success">
          <div className="step-icon-large success">
            <div className="checkmark">✓</div>
          </div>

          <h2 className="modal-title">{action} Confirmed!</h2>

          {swapTxHash && (
            <a
              href={`https://basescan.org/tx/${swapTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tx-link-large"
            >
              View {action} Txn (0x{swapTxHash.slice(2, 6)}...) ↗
            </a>
          )}

          <div className="progress-section single">
            <div className="progress-bar completed">
              <div className="progress-fill"></div>
            </div>
          </div>

          <button className="done-button" onClick={onClose}>
            Done
          </button>
        </div>
      );
    }
  };

  return (
    <div className="swap-modal-overlay" onClick={onClose}>
      <div className="swap-modal" onClick={(e) => e.stopPropagation()}>
        {renderContent()}
      </div>
    </div>
  );
};

export default SwapConfirmationModal;
