import React from "react";

export default AdminContent = ({ children, title="", headerActions=[], footer, ...props }) => {
  return (
    <React.Fragment>
      <div className="card shadow mb-4">
        <div className="card-header py-2">
          <div className="d-flex justify-content-between align-items-center">
            <div className="fw-bold">
              {title}
            </div>
            {headerActions.length > 0 &&
              <div className="btn-group" role="group">
                {headerActions.map((action, i) => {
                  return (
                    <React.Fragment key={`btn-action-${i}`}>
                      {action}
                    </React.Fragment>
                  )
                })}
              </div>
            }
          </div>
        </div>
        <div className="card-body">
          {children}
        </div>
        {footer &&
          <div className="card-footer">
            {footer}
          </div>
        }
      </div>
    </React.Fragment>
  )
}
