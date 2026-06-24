import React, { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import { getInputClassName, renderInputErrors } from "../helpers/AppHelper";
import PaperService from "../services/PaperService";

const emptyPaperForm = {
  name: ""
};

const CreatePaperModal = ({ show, onClose, onCreated, onAuthError }) => {
  const [paperForm, setPaperForm] = useState(emptyPaperForm);
  const [formErrors, setFormErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!show) {
      setPaperForm(emptyPaperForm);
      setFormErrors({});
      setErrorMessage("");
      setIsCreating(false);
    }
  }, [show]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setPaperForm((currentValues) => {
      return {
        ...currentValues,
        [name]: value
      };
    });
  };

  const handleClose = () => {
    if (isCreating) {
      return;
    }

    onClose();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsCreating(true);
    setFormErrors({});
    setErrorMessage("");

    PaperService.createPaper({
      name: paperForm.name
    })
      .then((response) => {
        onCreated(response.data);
      })
      .catch((error) => {
        if (onAuthError(error)) {
          return;
        }

        if (error.response?.status === 422) {
          setFormErrors(error.response.data);
          return;
        }

        setErrorMessage(error.response?.data?.message || "Unable to create paper.");
      })
      .finally(() => {
        setIsCreating(false);
      });
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <form onSubmit={handleSubmit}>
        <Modal.Header closeButton={!isCreating}>
          <Modal.Title>Add Paper</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row g-3">
            {errorMessage ? (
              <div className="col-12">
                <div className="alert alert-danger mb-0">
                  {errorMessage}
                </div>
              </div>
            ) : null}

            <div className="col-12">
              <label className="form-label" htmlFor="paper-name">
                Paper name
              </label>
              <input
                autoFocus
                className={getInputClassName(formErrors, "name")}
                disabled={isCreating}
                id="paper-name"
                name="name"
                onChange={handleChange}
                value={paperForm.name}
              />
              {renderInputErrors(formErrors, "name")}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            className="d-inline-flex align-items-center gap-2"
            disabled={isCreating}
            type="submit"
            variant="primary"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>{isCreating ? "Creating..." : "Create"}</span>
          </Button>
          <Button
            className="d-inline-flex align-items-center gap-2"
            disabled={isCreating}
            onClick={handleClose}
            type="button"
            variant="secondary"
          >
            <FontAwesomeIcon icon={faXmark} />
            <span>Cancel</span>
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default CreatePaperModal;
