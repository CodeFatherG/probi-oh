import React, { Component } from 'react';
import { Snackbar, Alert, Link } from '@mui/material';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    const { hasError, errorMessage } = this.state;
    const timeout = 6000; // 6 seconds

    if (hasError) {
      return (
        <>
          {this.props.children}
          <Snackbar
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            open={hasError}
            autoHideDuration={timeout}
            onClose={this.handleClose}
          >
            <Alert onClose={this.handleClose} severity="error" sx={{ width: '100%' }}>
              {errorMessage}
              <br />
              <Link
                href="https://github.com/CodeFatherG/probi-oh/issues/new/choose"
                className="text-blue-500 hover:text-blue-700"
                variant="caption"
                target="_blank"
                rel="noopener noreferrer"
              >
                Experienced an issue? Let us know!
              </Link>
            </Alert>
          </Snackbar>
        </>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;