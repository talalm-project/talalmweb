import React from "react";
import { Button, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import Loader from "./Loader";

export default ConfirmationModal = (props) => {
  return (
    <Modal
      show={props.show}
    >
      <Modal.Header>
        {props.header || "Confirmation"}
      </Modal.Header>
      <Modal.Body>
        {props.isLoading &&
          <Loader/>
        }
        {!props.isLoading &&
          <p>
            {props.content || "Are you sure?"}
          </p>
        }
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="primary"
          disabled={props.isLoading}
          onClick={props.onPrimaryClicked}
          className="d-inline-flex align-items-center gap-2"
        >
          <FontAwesomeIcon icon={faCheck} />
          <span>Confirm</span>
        </Button>
        <Button 
          variant="secondary"
          disabled={props.isLoading}
          onClick={props.onSecondaryClicked}
          className="d-inline-flex align-items-center gap-2"
        >
          <FontAwesomeIcon icon={faXmark} />
          <span>Close</span>
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
