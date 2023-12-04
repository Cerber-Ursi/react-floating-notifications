import React = require('react');
import NotificationItem from './NotificationItem';
import Constants from './constants';
import {GetStyles, Notification} from "./NotificationSystem";
import Styles from "./styles";
import {CSSProperties} from "react";

interface Props {
  position: keyof typeof Styles.Containers,
  notifications: Notification[],
  getStyles: GetStyles,
  onRemove: (_: string | number) => void,
  noAnimation: boolean,
  allowHTML: boolean,
  children?: React.ReactNode,
};

class NotificationContainer extends React.Component<Props> {
  private _style: CSSProperties;

  public refs: Record<string, NotificationItem> = {};

  constructor(props: Props) {
    super(props);
    // Fix position if width is overrided
    this._style = props.getStyles.container(props.position);

    if (
        props.getStyles.overrideWidth &&
        (props.position === Constants.positions.tc ||
            props.position === Constants.positions.bc)
    ) {
      this._style.marginLeft = -(props.getStyles.overrideWidth / 2);
    }
  }

  render() {
    var notifications;

    if (
        [
          Constants.positions.bl,
          Constants.positions.br,
          Constants.positions.bc
        ].indexOf(this.props.position) > -1
    ) {
      this.props.notifications.reverse();
    }

    notifications = this.props.notifications.map((notification) => {
      return (
          <NotificationItem
              ref={'notification-' + notification.uid}
              key={notification.uid}
              notification={notification}
              getStyles={this.props.getStyles}
              onRemove={this.props.onRemove}
              noAnimation={this.props.noAnimation}
              allowHTML={this.props.allowHTML}
              children={this.props.children}
          />
      );
    });

    return (
        <div
            className={'notifications-' + this.props.position}
            style={this._style}
        >
          {notifications}
        </div>
    );
  }
}

export default NotificationContainer;
