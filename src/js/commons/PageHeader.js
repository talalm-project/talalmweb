import React from "react";

const PageHeader = ({ eyebrow, title, actions = [] }) => {
  return (
    <div className="page-header">
      <div className="page-header-main">
        <div className="page-header-copy">
          {eyebrow ? (
            <p className="page-header-eyebrow">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="page-header-title">
            {title}
          </h1>
        </div>
      </div>

      {actions.length > 0 ? (
        <div className="page-header-actions">
          {actions.map((action, index) => {
            return (
              <React.Fragment key={`page-header-action-${index}`}>
                {action}
              </React.Fragment>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default PageHeader;
