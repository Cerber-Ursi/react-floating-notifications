var React = require('react');

// Styles
require('../styles/generator');

class NotificationGenerator extends React.Component {
  constructor() {
    super();
    this._notificationSystem = null;
    this._lastNotificationAdded = null;

    this.state = {
      notification: {
        title: 'Default title',
        message: 'Default message',
        level: 'error',
        position: 'tr',
        autoDismiss: 5,
        dismissible: 'both',
        action: null,
        actionState: false
      },
      allowHTML: false,
      newOnTop: false
    };

    this._changed = this._changed.bind(this);
  }

  _notify(event) {
    var notification = this.state.notification;
    event.preventDefault();

    notification.onRemove = this._onRemove.bind(this);

    console.log('Notification object', notification);

    this._lastNotificationAdded = this._notificationSystem()
      .addNotification(notification);
    this.setState({});
  }

  _removeLastNotification(event) {
    event.preventDefault();
    if (this._lastNotificationAdded) {
      this._notificationSystem()
        .removeNotification(this._lastNotificationAdded);
    }
  }

  _changed(event) {
    var notification = this.state.notification;
    var prop = event.target.name;
    var value = event.target.value;

    if (prop === 'autoDismiss') {
      if (value === '') {
        value = 0;
      }

      value = parseInt(value, 10);
    }

    notification[prop] = value;

    this.setState({
      notification: notification
    });
  }

  _onRemove(notification) {
    if (this._lastNotificationAdded && notification.uid === this._lastNotificationAdded.uid) {
      this._lastNotificationAdded = null;
    }
    this.setState({});
    console.log('%cNotification ' + notification.uid + ' was removed.', 'font-weight: bold; color: #eb4d00');
  }

  _changedAllowHTML() {
    var state = this.state;
    var allowHTML = !this.state.allowHTML;

    if (allowHTML) {
      state.notification.message += ' <strong>I\'m bold!</strong>';
    }
    state.allowHTML = allowHTML;
    this.setState(state);
    this.props.allowHTML(allowHTML);
  }

  _changeNewOnTop() {
    this.setState({
      newOnTop: !this.state.newOnTop
    });
    this.props.newOnTop(!this.state.newOnTop);
  }

  static _callbackForAction() {
    console.log('%cYou clicked an action button inside a notification!', 'font-weight: bold; color: #008feb');
  }

  _changedAction() {
    var notification = this.state.notification;
    notification.actionState = !notification.actionState;

    if (notification.actionState) {
      notification.action = {
        label: 'I\'m a button',
        callback: NotificationGenerator._callbackForAction
      };
    } else {
      notification.action = null;
    }

    this.setState({
      notification: notification
    });
  }

  _changedActionLabel(event) {
    var notification = this.state.notification;
    var value = event.target.value;

    notification.action.label = value;

    this.setState({
      notification: notification
    });
  }

  componentDidMount() {
    this._notificationSystem = this.props.notifications;
  }

  render() {
    var notification = this.state.notification;
    var error = {
      position: 'hide',
      dismissible: 'hide',
      level: 'hide',
      action: 'hide'
    };
    var action = null;
    var removeButton = null;

    if (notification.actionState) {
      action = (
        <div className="form-group">
          <label>Label:</label>
          <input className="form-control" name="label" onChange={ this._changedActionLabel.bind(this) } type="text" value={ notification.action.label }/>
        </div>
      );
    }

    if (this._lastNotificationAdded) {
      removeButton = (
        <div className="form-group">
          <button className="btn btn-block btn-danger" onClick={ this._removeLastNotification.bind(this) }>Programmatically remove last notification!</button>
        </div>
      );
    }

    if (notification.position === 'in') {
      error.position = 'text-danger';
    }

    if (notification.level === 'in') {
      error.level = 'text-danger';
    }

    if (!notification.dismissible && !notification.actionState) {
      error.dismissible = 'text-danger';
      error.action = 'text-danger';
    }

    return (
      <div className="generator">
        <h2>Notification generator</h2>
        <p>Open your console to see some logs from the component.</p>

        <div className="form-group">
          <label>Title:</label>
          <input className="form-control" name="title" onChange={ this._changed } type="text" value={ notification.title }/>
          <small>Leave empty to hide.</small>
        </div>

        <div className="form-group">
          <label>Message:</label>
          <input className="form-control" name="message" onChange={ this._changed } type="text" value={ notification.message }/>
          <small>
            <label>
              <input checked={ this.state.allowHTML } onChange={ this._changedAllowHTML.bind(this) } type="checkbox"/> Allow HTML in message?
            </label>
          </small>
        </div>

        <div className="form-group">
          <label>Position:</label>
          <select className="form-control" name="position" onChange={ this._changed } value={ notification.position }>
            <option value="tl">Top left (tl)</option>
            <option value="tr">Top right (tr)</option>
            <option value="tc">Top center (tc)</option>
            <option value="bl">Bottom left (bl)</option>
            <option value="br">Bottom right (br)</option>
            <option value="bc">Bottom center (bc)</option>
            <option value="in">Invalid position</option>
          </select>
          <small className={ error.position }>Open console to see the error after creating a notification.</small>
        </div>

        <div className="form-group">
          <label>Level:</label>
          <select className="form-control" name="level" onChange={ this._changed } value={ notification.level }>
            <option value="success">Success (success)</option>
            <option value="error">Error (error)</option>
            <option value="warning">Warning (warning)</option>
            <option value="info">Info (info)</option>
            <option value="in">Invalid level</option>
          </select>
          <small className={ error.level }>Open console to see the error after creating a notification.</small>
        </div>

        <div className="form-group">
          <label>Dismissible:</label>
          <select className="form-control" name="dismissible" onChange={ this._changed } value={ notification.dismissible }>
            <option value="both">Both (both)</option>
            <option value="click">Click (no dismiss button) (click)</option>
            <option value="button">Dismiss button only (button)</option>
            <option value="none">None (none)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Auto Dismiss:</label>
          <input className="form-control" name="autoDismiss" onChange={ this._changed } type="text" value={ notification.autoDismiss }/>
          <small>secs (0 means infinite)</small>
        </div>

        <div className="form-group">
          <div className="checkbox">
            <label>
              <input checked={ notification.actionState } onChange={ this._changedAction.bind(this) } type="checkbox"/> Set up an action?
            </label>
          </div>
          { action }
        </div>
        <div className="form-group">
          <div className="checkbox">
            <label>
              <input checked={ this.state.newOnTop } onChange={ this._changeNewOnTop.bind(this) } type="checkbox"/> New notifications on top?
            </label>
          </div>
        </div>
        <small style={ { marginLeft: 0 } } className={ error.dismissible }>This notification will be only dismissible programmatically or after "autoDismiss" timeout (if set).</small>

        { removeButton }

        <div className="form-group">
          <button className="btn btn-primary btn-block btn-notify" onClick={ this._notify.bind(this) }>Notify!</button>
        </div>

      </div>
    );
  }
}

module.exports = NotificationGenerator;
