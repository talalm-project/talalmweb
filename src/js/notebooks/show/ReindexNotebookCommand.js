import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons";
import ConfirmationModal from "../../commons/ConfirmationModal";
import NotebookService from "../../services/NotebookService";

class ReindexNotebookCommand extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isReindexing: false,
      showConfirmation: false
    };
  }

  openConfirmation = () => {
    this.setState({ showConfirmation: true });
  };

  closeConfirmation = () => {
    if (this.state.isReindexing) {
      return;
    }

    this.setState({ showConfirmation: false });
  };

  execute = () => {
    const { notebook, onAuthError, onCompleted, onError } = this.props;
    if (this.state.isReindexing || !notebook) {
      return;
    }

    this.setState({ isReindexing: true });
    NotebookService.reindexNotebook(notebook.id)
      .then((response) => {
        this.setState({ showConfirmation: false });
        if (onCompleted) {
          onCompleted(response);
        }
      })
      .catch((error) => {
        if (onAuthError && onAuthError(error)) {
          return;
        }

        this.setState({ showConfirmation: false });
        if (onError) {
          onError(error);
        }
      })
      .finally(() => {
        this.setState({ isReindexing: false });
      });
  };

  render() {
    const { disabled, fileCount = 0 } = this.props;
    const { isReindexing, showConfirmation } = this.state;

    return (
      <React.Fragment>
        <button
          className="btn btn-outline-primary talalm-reindex-button d-inline-flex align-items-center justify-content-center gap-2"
          disabled={disabled || isReindexing || fileCount === 0}
          onClick={this.openConfirmation}
          type="button"
        >
          <FontAwesomeIcon icon={faArrowsRotate} spin={isReindexing} />
          <span>{isReindexing ? "Reindexing..." : "Reindex"}</span>
        </button>

        <ConfirmationModal
          show={showConfirmation}
          isLoading={isReindexing}
          header="Reindex Notebook"
          content={`Reindex ${fileCount.toLocaleString()} notebook ${fileCount === 1 ? "file" : "files"}? This will delete existing embeddings and queue every file for re-embedding.`}
          loadingContent="Resetting files for re-embedding..."
          onPrimaryClicked={this.execute}
          onSecondaryClicked={this.closeConfirmation}
        />
      </React.Fragment>
    );
  }
}

export default ReindexNotebookCommand;
