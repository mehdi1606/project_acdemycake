import React from 'react';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import { Link, useNavigate } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import { useAppSelector, useAppDispatch } from '../../../core/redux/hooks';
import { removeFromCart, clearCart } from '../../../core/redux/cartSlice';
import { App } from 'antd';
import { getFileUrl } from '../../../environment';

const CourseCart = () => {
  const route = all_routes;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const { items } = useAppSelector((s) => s.cart);

  const subtotal = items.reduce((sum, item) => sum + (item.price ?? 0), 0);

  const handleRemove = (id: string, title: string) => {
    dispatch(removeFromCart(id));
    message.success(`"${title}" removed from cart`);
  };

  const handleClear = () => {
    dispatch(clearCart());
    message.info('Cart cleared');
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      message.warning('Please login to proceed to checkout');
      return;
    }
    navigate(route.courseCheckout);
  };

  const getLevelDisplay = (level?: string) => {
    switch (level) {
      case 'BEGINNER':     return 'Beginner';
      case 'INTERMEDIATE': return 'Intermediate';
      case 'ADVANCED':     return 'Advanced';
      case 'ALL_LEVELS':   return 'All Levels';
      default:             return level || '';
    }
  };

  return (
    <>
      <Breadcrumb title="Cart" />
      <div className="content">
        <div className="container">
          <div className="cart-cover">
            <div className="cart-items">

              {items.length === 0 ? (
                /* ── Empty state ── */
                <div className="text-center py-5">
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: 'rgba(107,29,42,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}>
                    <i className="isax isax-shopping-cart" style={{ fontSize: 36, color: 'rgba(107,29,42,0.35)' }} />
                  </div>
                  <h5 className="mb-2">Your cart is empty</h5>
                  <p className="text-muted mb-4">Add courses to your cart and start learning today.</p>
                  <Link to={route.courseList} className="btn btn-primary rounded-pill px-4">
                    Browse Courses
                  </Link>
                </div>
              ) : (
                <>
                  {/* ── Header ── */}
                  <div className="cart-head border-bottom d-flex justify-content-between align-items-center pb-4">
                    <h5 className="mb-0">
                      {items.length} Course{items.length !== 1 ? 's' : ''}
                    </h5>
                    <button
                      className="btn btn-sm btn-danger-ghost mb-0"
                      onClick={handleClear}
                    >
                      <i className="isax isax-close-circle me-1" />
                      Clear cart
                    </button>
                  </div>

                  {/* ── Items ── */}
                  <div className="row row-gap-3 pb-3 mb-3 border-bottom">
                    {items.map((item) => {
                      const thumb = getFileUrl(item.thumbnailUrl) ?? item.thumbnailUrl;
                      const avatar = getFileUrl(item.instructorAvatar);
                      return (
                        <div key={item.id} className="col-md-12">
                          <div className="cart-item mb-0">
                            <div className="row align-items-center row-gap-3">
                              {/* Thumbnail */}
                              <div className="col-md-3">
                                <div className="cart-img">
                                  <Link to={`${route.courseDetails}/${item.slug}`}>
                                    {thumb ? (
                                      <img
                                        src={thumb}
                                        alt={item.title}
                                        className="img-fluid w-100"
                                        style={{ borderRadius: 8, objectFit: 'cover', height: 120 }}
                                      />
                                    ) : (
                                      <div style={{
                                        height: 120, borderRadius: 8,
                                        background: 'rgba(107,29,42,0.06)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      }}>
                                        <i className="isax isax-book" style={{ fontSize: 32, color: 'rgba(107,29,42,0.3)' }} />
                                      </div>
                                    )}
                                  </Link>
                                </div>
                              </div>

                              {/* Details */}
                              <div className="col-md-9">
                                <div className="row align-items-center justify-content-between">
                                  <div className="col-md-9">
                                    {/* Instructor */}
                                    {item.instructorName && (
                                      <div className="d-flex align-items-center mb-2">
                                        <div className="avatar avatar-sm rounded-circle me-2">
                                          {avatar ? (
                                            <img src={avatar} alt={item.instructorName} className="img-fluid rounded-circle" />
                                          ) : (
                                            <div style={{
                                              width: 32, height: 32, borderRadius: '50%',
                                              background: 'rgba(107,29,42,0.1)',
                                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                                              fontSize: 13, fontWeight: 700, color: '#6B1D2A',
                                            }}>
                                              {item.instructorName.charAt(0).toUpperCase()}
                                            </div>
                                          )}
                                        </div>
                                        <p className="mb-0">
                                          {item.instructorId ? (
                                            <Link to={`${route.instructorDetails}/${item.instructorId}`}>
                                              {item.instructorName}
                                            </Link>
                                          ) : (
                                            <span>{item.instructorName}</span>
                                          )}
                                        </p>
                                      </div>
                                    )}

                                    {/* Title */}
                                    <div className="mb-2">
                                      <h6 className="fs-18 mb-0">
                                        <Link to={`${route.courseDetails}/${item.slug}`}>
                                          {item.title}
                                        </Link>
                                      </h6>
                                    </div>

                                    {/* Rating + level */}
                                    <div className="d-flex align-items-center flex-wrap gap-2">
                                      {item.rating !== undefined && (
                                        <>
                                          <span className="star me-1">
                                            <i className="fa-solid fa-star" />
                                          </span>
                                          <p className="mb-0">
                                            {item.rating.toFixed(1)}
                                            {item.ratingCount !== undefined && (
                                              <span className="text-muted ms-1">
                                                ({item.ratingCount} Reviews)
                                              </span>
                                            )}
                                          </p>
                                        </>
                                      )}
                                      {item.level && (
                                        <>
                                          <span className="mx-1 bg-secondary rounded-circle dot" />
                                          <p className="mb-0">{getLevelDisplay(item.level)}</p>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {/* Price + remove */}
                                  <div className="col-md-3">
                                    <div className="d-flex align-items-center justify-content-end gap-4 cart-trash">
                                      <div>
                                        <h5 className="text-secondary mb-0">
                                          {item.price === 0 ? 'Free' : `$${item.price}`}
                                        </h5>
                                        {item.originalPrice && item.originalPrice > item.price && (
                                          <del className="text-muted fs-13">${item.originalPrice}</del>
                                        )}
                                      </div>
                                      <button
                                        className="trash-btn border-0 bg-transparent"
                                        onClick={() => handleRemove(item.id, item.title)}
                                        title="Remove from cart"
                                      >
                                        <i className="isax isax-trash4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Subtotal ── */}
                  <div className="bg-light border rounded-2 p-3 mb-4">
                    <div className="row align-items-center justify-content-between row-gap-3">
                      <div className="col-md-6">
                        <h6 className="mb-1">Subtotal</h6>
                        <p className="mb-0">
                          All Courses have a{' '}
                          <span className="text-gray-9 fw-medium mx-1">30-day</span>
                          money-back guarantee
                        </p>
                      </div>
                      <div className="col-md-6 text-end">
                        <h5 className="mb-0">
                          {subtotal === 0 ? 'Free' : `$${subtotal.toFixed(2)}`}
                        </h5>
                        {items.some((i) => (i.originalPrice ?? 0) > i.price) && (
                          <small className="text-muted">
                            You save $
                            {items.reduce((s, i) => s + ((i.originalPrice ?? i.price) - i.price), 0).toFixed(2)}
                          </small>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Actions ── */}
                  <div className="d-flex align-items-center justify-content-end flex-wrap gap-2">
                    <Link
                      to={route.courseGrid}
                      className="btn continue-shopping-btn rounded-pill"
                    >
                      Continue Shopping
                    </Link>
                    <button
                      className="btn checkout-btn rounded-pill"
                      onClick={handleCheckout}
                    >
                      Checkout
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CourseCart;
