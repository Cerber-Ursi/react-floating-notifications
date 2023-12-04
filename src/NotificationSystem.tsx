import React = require('react');
import merge = require('object-assign');
import NotificationContainer from './NotificationContainer';
import Constants from './constants';
import Styles from './styles';
import {CSSProperties} from "react";
import {Property} from "csstype";
import NotificationItem from "./NotificationItem";

// TODO - более точная типизация (фиксированный набор ключей)
type Style = Record<string, Record<string, CSSProperties>>;

interface Props {
  style?: false | Style;
  noAnimation?: boolean;
  allowHTML?: boolean,
  newOnTop?: boolean;
}

interface State {
  notifications: Notification[];
}

export interface Notification {
  className: string;
  title: string;
  message: string;
  // TODO - явное перечисление
  level: string;
  // TODO - явное перечисление
  position: string;
  autoDismiss: number;
  // TODO - явное перечисление
  dismissible: string | boolean;
  action: {
    label: string;
    callback?: () => void;
  };
  children: React.ReactNode;
  uid: number | string;
  onAdd: (_: Notification) => void;
  onRemove: (_: Notification) => void;

  // TODO - это внутреннее поле, его не надо показывать пользователям
  ref: string;
}

const elements: Elements = {
  notification: 'NotificationItem',
  title: 'Title',
  messageWrapper: 'MessageWrapper',
  dismiss: 'Dismiss',
  action: 'Action',
  actionWrapper: 'ActionWrapper'
};

// TODO - явная типизация
type Element = keyof typeof Styles;

interface Elements {
  notification: Element;
  messageWrapper: Element;
  actionWrapper: Element;
  dismiss: Element;
  action: Element;
  title: Element
}

export interface GetStyles {
  container: (position: keyof typeof Styles.Containers) => ({});
  overrideWidth: number | null;
  overrideStyle: {};
  elements: Elements;
  byElement: (element: keyof Elements) => (level: string) => CSSProperties;
  wrapper: () => ({});
  setOverrideStyle: (style: false | Style) => void
}

class NotificationSystem extends React.Component<Props, State> {
  // TODO - deprecated, позже лучше отрефакторить
  static defaultProps = {
    style: {},
    noAnimation: false,
    allowHTML: false,
    newOnTop: false
  };
  private uid: number;
  private _isMounted: boolean;
  private overrideWidth: Property.Width<number | string> | null | undefined;
  // TODO - типизировать нормально, не смешивая
  private overrideStyle: false | Style;
  private _getStyles: GetStyles;

  public refs: Record<string, NotificationContainer> = {};

  constructor(props: Props) {
    super(props);
    this.state = {
      notifications: []
    };
    this.uid = 3400;
    this._isMounted = false;
    this.overrideWidth = null;
    this.overrideStyle = {};

    this.setOverrideStyle = this.setOverrideStyle.bind(this);
    this.wrapper = this.wrapper.bind(this);
    this.container = this.container.bind(this);
    this.byElement = this.byElement.bind(this);
    this._didNotificationRemoved = this._didNotificationRemoved.bind(this);
    this.addNotification = this.addNotification.bind(this);
    this.getNotificationRef = this.getNotificationRef.bind(this);
    this.removeNotification = this.removeNotification.bind(this);
    this.editNotification = this.editNotification.bind(this);
    this.clearNotifications = this.clearNotifications.bind(this);

    this._getStyles = {
      overrideWidth: this.overrideWidth,
      overrideStyle: this.overrideStyle,
      elements: elements,
      setOverrideStyle: this.setOverrideStyle,
      wrapper: this.wrapper,
      container: this.container,
      byElement: this.byElement
    };
  }

  componentDidMount() {
    this.setOverrideStyle(this.props.style || {});
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  setOverrideStyle(style: false | Style) {
    this.overrideStyle = style;
  }

  wrapper() {
    if (!this.overrideStyle) return {};
    return merge({}, Styles.Wrapper, this.overrideStyle.Wrapper);
  }

  // TODO явное перечисление для положений (сейчас оно типизировано строго, но неявно)
  container(position: keyof typeof Styles.Containers) {
    var override = (this.overrideStyle || {}).Containers || {};
    if (!this.overrideStyle) return {};

    this.overrideWidth = Styles.Containers.DefaultStyle.width;

    if (override.DefaultStyle && override.DefaultStyle.width) {
      this.overrideWidth = override.DefaultStyle.width;
    }

    if (override[position] && override[position].width) {
      this.overrideWidth = override[position].width;
    }

    return merge(
        {},
        Styles.Containers.DefaultStyle,
        Styles.Containers[position],
        override.DefaultStyle,
        override[position]
    );
  }

  byElement(element: keyof Elements) {
    // TODO - явное перечисление
    return (level: string): CSSProperties => {
      var _element = elements[element];
      var override = (this.overrideStyle || {})[_element] || {};
      if (!this.overrideStyle) return {};
      return merge(
          {},
          // TODO корректная типизация
          (Styles[_element] as any).DefaultStyle,
          (Styles[_element] as any)[level],
          override.DefaultStyle,
          override[level]
      );
    };
  }

  _didNotificationRemoved(uid: string | number) {
    var notification: Notification | undefined;
    var notifications = this.state.notifications.filter(function (toCheck) {
      if (toCheck.uid === uid) {
        notification = toCheck;
        return false;
      }
      return true;
    });

    if (this._isMounted) {
      this.setState({notifications: notifications});
    }

    if (notification && notification.onRemove) {
      notification.onRemove(notification);
    }
  }

  addNotification(notification: Partial<Notification>) {
    var _notification: Notification = merge({}, Constants.notification, notification);
    var notifications = this.state.notifications;
    var i;


    if (!_notification.level) {
      throw new Error('notification level is required.');
    }

    if (Object.keys(Constants.levels).indexOf(_notification.level) === -1) {
      throw new Error("'" + _notification.level + "' is not a valid level.");
    }

    // eslint-disable-next-line
    if (isNaN(_notification.autoDismiss)) {
      throw new Error("'autoDismiss' must be a number.");
    }

    if (
        Object.keys(Constants.positions).indexOf(_notification.position) === -1
    ) {
      throw new Error("'" + _notification.position + "' is not a valid position.");
    }

    // Some preparations
    _notification.position = _notification.position.toLowerCase();
    _notification.level = _notification.level.toLowerCase();

    _notification.uid = _notification.uid || this.uid;
    _notification.ref = 'notification-' + _notification.uid;
    this.uid += 1;


    // do not add if the notification already exists based on supplied uid
    for (i = 0; i < notifications.length; i += 1) {
      if (notifications[i].uid === _notification.uid) {
        return false;
      }
    }

    if (this.props.newOnTop) {
      notifications.unshift(_notification);
    } else {
      notifications.push(_notification);
    }


    if (typeof _notification.onAdd === 'function') {
      _notification.onAdd(_notification);
    }

    this.setState({
      notifications: notifications
    });

    return _notification;
  }

  // TODO - переписать это с использованием новых refs
  // TODO - разобраться, нафига сюда вообще передавать целиком Notification
  getNotificationRef(notification: string | number | Notification): NotificationItem | null {
    var foundNotification = null;

    Object.keys(this.refs).forEach((container) => {
      if (container.indexOf('container') > -1) {
        Object.keys(this.refs[container].refs).forEach((_notification) => {
          var uid = (notification as Notification).uid ? (notification as Notification).uid : notification as string | number;
          if (_notification === 'notification-' + uid) {
            // NOTE: Stop iterating further and return the found notification.
            // Since UIDs are uniques and there won't be another notification found.
            foundNotification = this.refs[container].refs[_notification] as NotificationItem;
          }
        });
      }
    });

    return foundNotification;
  }

  removeNotification(notification: string | number | Notification) {
    var foundNotification = this.getNotificationRef(notification);
    return foundNotification && foundNotification._hideNotification();
  }

  editNotification(notification: string | number | Notification, newNotification: Partial<Notification>) {
    var foundNotification = null;
    // NOTE: Find state notification to update by using
    // `setState` and forcing React to re-render the component.
    var uid = (notification as Notification).uid ? (notification as Notification).uid : notification as string | number;

    var newNotifications = this.state.notifications.filter(function (stateNotification) {
      if (uid === stateNotification.uid) {
        foundNotification = stateNotification;
        return false;
      }

      return true;
    });

    if (!foundNotification) {
      return;
    }

    newNotifications.push(merge({}, foundNotification, newNotification));

    this.setState({
      notifications: newNotifications
    });
  }

  clearNotifications() {
    Object.keys(this.refs).forEach((container) => {
      if (container.indexOf('container') > -1) {
        Object.keys(this.refs[container].refs).forEach((_notification) => {
          this.refs[container].refs[_notification]._hideNotification();
        });
      }
    });
  }

  render() {
    var containers = null;
    var notifications = this.state.notifications;

    if (notifications.length) {
      containers = Object.keys(Constants.positions).map((position) => {
        let pos = position as keyof typeof Constants.positions;
        var _notifications = notifications.filter((notification) => {
          return pos === notification.position;
        });

        if (!_notifications.length) {
          return null;
        }

        return (
            <NotificationContainer
                ref={'container-' + pos}
                key={pos}
                position={pos}
                notifications={_notifications}
                getStyles={this._getStyles}
                onRemove={this._didNotificationRemoved}
                noAnimation={this.props.noAnimation || false}
                allowHTML={this.props.allowHTML || false}
            />
        );
      });
    }

    return (
        <div className="notifications-wrapper" style={this.wrapper()}>
          {containers}
        </div>
    );
  }
}

export default NotificationSystem;
