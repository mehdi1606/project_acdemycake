import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import CustomSelect from "../../../../core/common/commonSelect";
import {
  City,
  Country,
  State,
} from "../../../../core/common/selectOption/json/selectOption";

const SettingsModal = () => {
  const { t } = useTranslation()
  return (
    <>
      <>
        {/* Delete Modal */}
        <div className="modal fade" id="delete_modal">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center custom-modal-body">
                <span className="avatar avatar-lg bg-secondary-transparent rounded-circle mb-2">
                  <i className="isax isax-trash fs-24 text-danger" />
                </span>
                <div>
                  <h4 className="mb-2">Remove All</h4>
                  <p className="mb-3">
                    Are you sure you want to remove all from wishlist?
                  </p>
                  <div className="d-flex align-items-center justify-content-center">
                    <Link
                      to="#"
                      className="btn bg-gray-100 rounded-pill me-2"
                      data-bs-dismiss="modal"
                    >
                      Cancel
                    </Link>
                    <Link
                      to="#"
                      className="btn btn-secondary rounded-pill"
                      data-bs-dismiss="modal"
                    >
                      Yes, Remove All
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /Delete Modal */}
        {/* Delete Modal */}
        <div className="modal fade" id="delete_account">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5>{t('student.deleteAccount.title', 'Delete Account')}</h5>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <i className="isax isax-close-circle5" />
                </button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <h6 className="mb-1">{t('student.deleteAccount.why', 'Why are you deleting your account?')}</h6>
                  <p>
                    {t('student.deleteAccount.intro', "We're sorry to see you go! To help us improve, please let us know your reason for deleting your account.")}
                  </p>
                </div>
                <div>
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="reason"
                      id="Radio-sm-1"
                    />
                    <label
                      className="fw-medium form-check-label text-gray-9"
                      htmlFor="Radio-sm-1"
                    >
                      {t('student.deleteAccount.r1', 'No longer using the service')}
                    </label>
                    <p>
                      {t('student.deleteAccount.r1Desc', "I no longer need this service and won't be using it in the future.")}
                    </p>
                  </div>
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="reason"
                      id="Radio-sm-2"
                    />
                    <label
                      className="fw-medium form-check-label text-gray-9"
                      htmlFor="Radio-sm-2"
                    >
                      {t('student.deleteAccount.r2', 'Privacy concerns')}
                    </label>
                    <p>
                      {t('student.deleteAccount.r2Desc', 'I am concerned about how my data is handled and want to remove my information.')}
                    </p>
                  </div>
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="reason"
                      id="Radio-sm-3"
                    />
                    <label
                      className="fw-medium form-check-label text-gray-9"
                      htmlFor="Radio-sm-3"
                    >
                      {t('student.deleteAccount.r3', 'Too many notifications/emails')}
                    </label>
                    <p>
                      {t('student.deleteAccount.r3Desc', "I'm overwhelmed by the volume of notifications or emails and would like to reduce them.")}
                    </p>
                  </div>
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="reason"
                      id="Radio-sm-4"
                    />
                    <label
                      className="fw-medium form-check-label text-gray-9"
                      htmlFor="Radio-sm-4"
                    >
                      {t('student.deleteAccount.r4', 'Poor user experience')}
                    </label>
                    <p>
                      {t('student.deleteAccount.r4Desc', "I've had difficulty using the platform, and it didn't meet my expectations.")}
                    </p>
                  </div>
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="reason"
                      id="Radio-sm-5"
                    />
                    <label
                      className="fw-medium form-check-label text-gray-9"
                      htmlFor="Radio-sm-5"
                    >
                      {t('student.deleteAccount.r5', 'Other (please specify)')}
                    </label>
                  </div>
                  <div>
                    <textarea
                      rows={3}
                      className="form-control"
                      defaultValue={""}
                    />
                  </div>
                  <p className="mt-3 mb-0 fs-13 text-muted">
                    <i className="isax isax-info-circle me-1" />
                    {t('student.deleteAccount.howTo', 'For your security, account deletion is handled by our team. Continue to the Contact page and send us your request; we will confirm by email.')}
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn bg-gray-100 rounded-pill me-2"
                  type="button"
                  data-bs-dismiss="modal"
                >
                  {t('student.deleteAccount.keep', 'Keep My Account')}
                </button>
                <Link
                  to={all_routes.contactUs}
                  className="btn btn-secondary rounded-pill"
                  data-bs-dismiss="modal"
                >
                  {t('student.deleteAccount.request', 'Request account deletion')}
                </Link>
              </div>
            </div>
          </div>
        </div>
        {/* /Delete Modal */}
      </>
      <>
        {/* Add Billing */}
        <div className="modal fade" id="add_billing">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Add Billing Address</h5>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <i className="isax isax-close-circle5" />
                </button>
              </div>
              <form>
                <div className="modal-body pb-0">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">
                          Title <span className="text-danger"> *</span>
                        </label>
                        <input type="text" className="form-control" />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">
                          Address <span className="text-danger"> *</span>
                        </label>
                        <input type="text" className="form-control" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          Country <span className="text-danger"> *</span>
                        </label>
                        <CustomSelect
                          options={Country}
                          className="select d-flex"
                          placeholder="Select"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          State <span className="text-danger"> *</span>
                        </label>
                        <CustomSelect
                          options={State}
                          className="select d-flex"
                          placeholder="Select"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          City <span className="text-danger"> *</span>
                        </label>
                        <CustomSelect
                          options={City}
                          className="select d-flex"
                          placeholder="Select"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          Postal Code <span className="text-danger"> *</span>
                        </label>
                        <input type="text" className="form-control" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn bg-gray-100 rounded-pill me-2"
                    type="button"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-secondary rounded-pill"
                    data-bs-dismiss="modal"
                    type="button"
                  >
                    Add Address
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        {/* /Add Billing */}
        {/* Edit Billing */}
        <div className="modal fade" id="edit_billing">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Edit Billing Address</h5>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <i className="isax isax-close-circle5" />
                </button>
              </div>
              <form >
                <div className="modal-body pb-0">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">
                          Title <span className="text-danger"> *</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          defaultValue="Home"
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">
                          Address <span className="text-danger"> *</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          defaultValue="16 Lake Floyd Circle"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          Country <span className="text-danger"> *</span>
                        </label>
                        <CustomSelect
                          options={Country}
                          className="select d-flex"
                          placeholder="Select"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          State <span className="text-danger"> *</span>
                        </label>
                        <CustomSelect
                          options={State}
                          className="select d-flex"
                          placeholder="Select"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          City <span className="text-danger"> *</span>
                        </label>
                        <CustomSelect
                          options={City}
                          className="select d-flex"
                          placeholder="Select"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          Postal Code <span className="text-danger"> *</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          defaultValue={90001}
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="form-check form-check-md my-4">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          defaultValue=""
                          id="defaultaccount"
                        />
                        <label
                          className="form-check-label"
                          htmlFor="defaultaccount"
                        >
                          Yes, I'd like to delete my account
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn bg-gray-100 rounded-pill me-2"
                    type="button"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-secondary rounded-pill"
                    type="button"
                    data-bs-dismiss="modal"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        {/* /Edit Billing */}
        {/* Delete Modal */}
        <div className="modal fade" id="delete_modal">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center custom-modal-body">
                <span className="avatar avatar-lg bg-secondary-transparent rounded-circle mb-2">
                  <i className="isax isax-trash fs-24 text-danger" />
                </span>
                <div>
                  <h4 className="mb-2">Delete Address</h4>
                  <p className="mb-3">
                    Are you sure you want to delete address?
                  </p>
                  <div className="d-flex align-items-center justify-content-center">
                    <Link
                      to="#"
                      className="btn bg-gray-100 rounded-pill me-2"
                      data-bs-dismiss="modal"
                    >
                      Cancel
                    </Link>
                    <Link to="#" className="btn btn-secondary rounded-pill">
                      Yes, Remove All
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /Delete Modal */}
      </>
    </>
  );
};

export default SettingsModal;
