import React from 'react';
import PropTypes from 'prop-types';
import createClass from 'create-react-class';

const Badge = createClass({
  propTypes: {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    use: PropTypes.string,
  },

  render() {
    const { children, className, use: __use, ...rest } = this.props;

    return (
      <span {...rest} className={className}>
        {children}
      </span>
    );
  },
});

export default Badge;
