/* global sinon */

import React = require('react');
import TestUtils = require('react-dom/test-utils');
import merge = require('object-assign');
import sinon = require('sinon');
import {Component} from 'react';
import {expect} from 'chai';
import {constants, NotificationSystem} from '../src';
import {Notification} from "../src/NotificationSystem";

const {positions, levels} = constants;

const defaultNotification: Partial<Notification> = {
  title: 'This is a title',
  message: 'This is a message',
  level: 'success'
};

const style = {
  Containers: {
    DefaultStyle: {
      width: 600
    },

    tl: {
      width: 800
    }
  }
};

const ref = 'notificationSystem';
// TODO - зарефакторить, чтобы не морочиться с ref-ами
class ElementWrapper extends Component {
  render() {
    return <NotificationSystem ref={ref} style={style} allowHTML={true} noAnimation={true}/>;
  }
}

describe('Notification Component', function () {
  let instance: ElementWrapper;
  let component: NotificationSystem;
  let clock: sinon.SinonFakeTimers | undefined;
  let notificationObj: Notification;

  this.timeout(10000);

  beforeEach(() => {

    instance = TestUtils.renderIntoDocument(React.createElement(ElementWrapper));
    component = instance.refs[ref] as NotificationSystem;
    notificationObj = merge({}, defaultNotification) as Notification;

    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock!.restore();
  });

  it('should be rendered', done => {
    const renderedComponent = TestUtils.findRenderedDOMComponentWithClass(instance, 'notifications-wrapper');
    expect(renderedComponent).to.not.be.null;
    done();
  });

  it('should hold the component ref', done => {
    expect(component).to.not.be.null;
    done();
  });

  it('should render a single notification', done => {
    component.addNotification(defaultNotification) as Notification;
    let notification = TestUtils.scryRenderedDOMComponentsWithClass(instance, 'notification');
    expect(notification.length).to.equal(1);
    done();
  });

  it('should not set a notification visibility class when the notification is initially added', done => {
    component.addNotification(defaultNotification) as Notification;
    let notification = TestUtils.findRenderedDOMComponentWithClass(instance, 'notification');
    expect(notification.className).to.not.match(/notification-hidden/);
    expect(notification.className).to.not.match(/notification-visible/);
    done();
  });

  it('should set the notification class to visible after added', done => {
    component.addNotification(defaultNotification) as Notification;
    let notification = TestUtils.findRenderedDOMComponentWithClass(instance, 'notification');
    expect(notification.className).to.match(/notification/);
    clock!.tick(400);
    expect(notification.className).to.match(/notification-visible/);
    done();
  });

  it('should add additional classes to the notification if specified', done => {
    component.addNotification(Object.assign({}, defaultNotification, {className: 'FOO'}));
    let notification = TestUtils.findRenderedDOMComponentWithClass(instance, 'notification');
    expect(notification.className).to.contain(' FOO');
    done();
  });

  it('should render notifications in all positions with all levels', done => {
    let count = 0;
    for (let position of Object.keys(positions)) {
      for (let level of Object.keys(levels)) {
        notificationObj.position = positions[position as keyof typeof positions];
        notificationObj.level = levels[level as keyof typeof levels];
        component.addNotification(notificationObj);
        count++;
      }
    }

    let containers = [];

    for (let position of Object.keys(positions)) {
      containers.push(TestUtils.findRenderedDOMComponentWithClass(instance, 'notifications-' + positions[position as keyof typeof positions]));
    }

    containers.forEach(function (container) {
      for (let level of Object.keys(levels)) {
        let notification = container.getElementsByClassName('notification-' + levels[level as keyof typeof levels]);
        expect(notification).to.not.be.null;
      }
    });

    let notifications = TestUtils.scryRenderedDOMComponentsWithClass(instance, 'notification');
    expect(notifications.length).to.equal(count);
    done();
  });

  it('should render multiple notifications', done => {
    const randomNumber = Math.floor(Math.random() * 5 + 5);

    for (let i = 1; i <= randomNumber; i++) {
      component.addNotification(defaultNotification) as Notification;
    }

    let notifications = TestUtils.scryRenderedDOMComponentsWithClass(instance, 'notification');
    expect(notifications.length).to.equal(randomNumber);
    done();
  });

  it('should not render notifications with the same uid', done => {
    notificationObj.uid = 500;
    component.addNotification(notificationObj);
    component.addNotification(notificationObj);
    let notification = TestUtils.scryRenderedDOMComponentsWithClass(instance, 'notification');
    expect(notification.length).to.equal(1);
    done();
  });

  it('should remove a notification after autoDismiss', function (done) {
    notificationObj.autoDismiss = 2;
    component.addNotification(notificationObj);
    clock!.tick(3000);
    let notification = TestUtils.scryRenderedDOMComponentsWithClass(instance, 'notification');
    expect(notification.length).to.equal(0);
    done();
  });

  it('should remove a notification using returned object', done => {
    let notificationCreated = component.addNotification(defaultNotification) as Notification;
    let notification = TestUtils.scryRenderedDOMComponentsWithClass(instance, 'notification');
    expect(notification.length).to.equal(1);

    component.removeNotification(notificationCreated);
    clock!.tick(1000);
    let notificationRemoved = TestUtils.scryRenderedDOMComponentsWithClass(instance, 'notification');
    expect(notificationRemoved.length).to.equal(0);
    done();
  });

  it('should remove a notification using uid', done => {
    let notificationCreated = component.addNotification(defaultNotification) as Notification;
    let notification = TestUtils.scryRenderedDOMComponentsWithClass(instance, 'notification');
    expect(notification.length).to.equal(1);

    component.removeNotification(notificationCreated.uid);
    clock!.tick(200);
    let notificationRemoved = TestUtils.scryRenderedDOMComponentsWithClass(instance, 'notification');
    expect(notificationRemoved.length).to.equal(0);
    done();
  });

  it('should edit an existing notification using returned object', (done) => {
    const notificationCreated = component.addNotification(defaultNotification) as Notification;
    const notification = TestUtils.scryRenderedDOMComponentsWithClass(instance, 'notification');
    expect(notification.length).to.equal(1);

    const newTitle = 'foo';
    const newContent = 'foobar';

    component.editNotification(notificationCreated, {title: newTitle, message: newContent});
    clock!.tick(1000);
    const notificationEdited = TestUtils.findRenderedDOMComponentWithClass(instance, 'notification');
    expect(notificationEdited.getElementsByClassName('notification-title')[0].textContent).to.equal(newTitle);
    expect(notificationEdited.getElementsByClassName('notification-message')[0].textContent).to.equal(newContent);
    done();
  });

  it('should edit an existing notification using uid', (done) => {
    const notificationCreated = component.addNotification(defaultNotification) as Notification;
    const notification = TestUtils.scryRenderedDOMComponentsWithClass(instance, 'notification');
    expect(notification.length).to.equal(1);

    const newTitle = 'foo';
    const newContent = 'foobar';

    component.editNotification(notificationCreated.uid, {title: newTitle, message: newContent});
    clock!.tick(1000);
    const notificationEdited = TestUtils.findRenderedDOMComponentWithClass(instance, 'notification');
    expect(notificationEdited.getElementsByClassName('notification-title')[0].textContent).to.equal(newTitle);
    expect(notificationEdited.getElementsByClassName('notification-message')[0].textContent).to.equal(newContent);
    done();
  });

  it('should remove all notifications', done => {
    component.addNotification(defaultNotification) as Notification;
    component.addNotification(defaultNotification) as Notification;
    component.addNotification(defaultNotification) as Notification;
    let notification = TestUtils.scryRenderedDOMComponentsWithClass(instance, 'notification');
    expect(notification.length).to.equal(3);
    component.clearNotifications();
    clock!.tick(200);
    let notificationRemoved = TestUtils.scryRenderedDOMComponentsWithClass(instance, 'notification');
    expect(notificationRemoved.length).to.equal(0);
    done();
  });

  it('should dismiss notification on click', done => {
    component.addNotification(notificationObj);
    let notification = TestUtils.findRenderedDOMComponentWithClass(instance, 'notification');
    TestUtils.Simulate.click(notification);
    clock!.tick(1000);
    let notificationRemoved = TestUtils.scryRenderedDOMComponentsWithClass(instance, 'notification');
    expect(notificationRemoved.length).to.equal(0);
    done();
  });

  it('should dismiss notification on click of dismiss button', done => {
    component.addNotification(notificationObj);
    let dismissButton = TestUtils.findRenderedDOMComponentWithClass(instance, 'notification-dismiss');
    TestUtils.Simulate.click(dismissButton);
    clock!.tick(1000);
    let notificationRemoved = TestUtils.scryRenderedDOMComponentsWithClass(instance, 'notification');
    expect(notificationRemoved.length).to.equal(0);
    done();
  });

  it('should not render title if not provided', done => {
    delete (notificationObj as any).title;
    component.addNotification(notificationObj);
    let notification = TestUtils.scryRenderedDOMComponentsWithClass(instance, 'notification-title');
    expect(notification.length).to.equal(0);
    done();
  });

  it('should not render message if not provided', done => {
    delete (notificationObj as any).message;
    component.addNotification(notificationObj);
    let notification = TestUtils.scryRenderedDOMComponentsWithClass(instance, 'notification-message');
    expect(notification.length).to.equal(0);
    done();
  });

  it('should not dismiss the notificaion on click if dismissible is false', done => {
    notificationObj.dismissible = false;
    component.addNotification(notificationObj);
    let notification = TestUtils.findRenderedDOMComponentWithClass(instance, 'notification');
    TestUtils.Simulate.click(notification);
    let notificationAfterClicked = TestUtils.findRenderedDOMComponentWithClass(instance, 'notification');
    expect(notificationAfterClicked).to.not.be.null;
    done();
  });

  it('should not dismiss the notification on click if dismissible is none', done => {
    notificationObj.dismissible = 'none';
    component.addNotification(notificationObj);
    let notification = TestUtils.findRenderedDOMComponentWithClass(instance, 'notification');
    TestUtils.Simulate.click(notification);
    let notificationAfterClicked = TestUtils.findRenderedDOMComponentWithClass(instance, 'notification');
    expect(notificationAfterClicked).to.exist;
    done();
  });

  it('should not dismiss the notification on click if dismissible is button', done => {
    notificationObj.dismissible = 'button';
    component.addNotification(notificationObj);
    let notification = TestUtils.findRenderedDOMComponentWithClass(instance, 'notification');
    TestUtils.Simulate.click(notification);
    let notificationAfterClicked = TestUtils.findRenderedDOMComponentWithClass(instance, 'notification');
    expect(notificationAfterClicked).to.exist;
    done();
  });

  it('should render a button if action property is passed', done => {
    defaultNotification.action = {
      label: 'Click me',
      callback: function () {
      }
    };

    component.addNotification(defaultNotification) as Notification;
    let button = TestUtils.findRenderedDOMComponentWithClass(instance, 'notification-action-button');
    expect(button).to.not.be.null;
    done();
  });

  it('should execute a callback function when notification button is clicked', done => {
    let testThis = false;
    notificationObj.action = {
      label: 'Click me',
      callback: function () {
        testThis = true;
      }
    };

    component.addNotification(notificationObj);
    let button = TestUtils.findRenderedDOMComponentWithClass(instance, 'notification-action-button');
    TestUtils.Simulate.click(button);
    expect(testThis).to.equal(true);
    done();
  });

  it('should accept an action without callback function defined', done => {
    notificationObj.action = {
      label: 'Click me'
    };

    component.addNotification(notificationObj);
    let button = TestUtils.findRenderedDOMComponentWithClass(instance, 'notification-action-button');
    TestUtils.Simulate.click(button);
    let notification = TestUtils.scryRenderedDOMComponentsWithClass(instance, 'notification');
    expect(notification.length).to.equal(0);
    done();
  });

  it('should execute a callback function on add a notification', done => {
    let testThis = false;
    notificationObj.onAdd = function () {
      testThis = true;
    };

    component.addNotification(notificationObj);
    expect(testThis).to.equal(true);
    done();
  });

  it('should execute a callback function on remove a notification', done => {
    let testThis = false;
    notificationObj.onRemove = function () {
      testThis = true;
    };

    component.addNotification(notificationObj);
    let notification = TestUtils.findRenderedDOMComponentWithClass(instance, 'notification');
    TestUtils.Simulate.click(notification);
    expect(testThis).to.equal(true);
    done();
  });

  it('should render a children if passed', done => {
    defaultNotification.children = (
        <div className="custom-container"></div>
    );

    component.addNotification(defaultNotification) as Notification;
    let customContainer = TestUtils.findRenderedDOMComponentWithClass(instance, 'custom-container');
    expect(customContainer).to.not.be.null;
    done();
  });

  it('should pause the timer if a notification has a mouse enter', done => {
    notificationObj.autoDismiss = 2;
    component.addNotification(notificationObj);
    let notification = TestUtils.findRenderedDOMComponentWithClass(instance, 'notification');
    TestUtils.Simulate.mouseEnter(notification);
    clock!.tick(4000);
    let _notification = TestUtils.findRenderedDOMComponentWithClass(instance, 'notification');
    expect(_notification).to.not.be.null;
    done();
  });

  it('should resume the timer if a notification has a mouse leave', done => {
    notificationObj.autoDismiss = 2;
    component.addNotification(notificationObj);
    let notification = TestUtils.findRenderedDOMComponentWithClass(instance, 'notification');
    TestUtils.Simulate.mouseEnter(notification);
    clock!.tick(800);
    TestUtils.Simulate.mouseLeave(notification);
    clock!.tick(2000);
    let _notification = TestUtils.scryRenderedDOMComponentsWithClass(instance, 'notification');
    expect(_notification.length).to.equal(0);
    done();
  });

  it('should allow HTML inside messages', done => {
    defaultNotification.message = '<strong class="allow-html-strong">Strong</strong>';
    component.addNotification(defaultNotification) as Notification;
    let notification = TestUtils.findRenderedDOMComponentWithClass(instance, 'notification-message');
    let htmlElement = notification.getElementsByClassName('allow-html-strong');
    expect(htmlElement.length).to.equal(1);
    done();
  });

  it('should render containers with a overriden width', done => {
    notificationObj.position = 'tc';
    component.addNotification(notificationObj);
    let notification = TestUtils.findRenderedDOMComponentWithClass(instance, 'notifications-tc') as HTMLElement;
    let width = notification.style.width;
    expect(width).to.equal('600px');
    done();
  });

  it('should render a notification with specific style based on position', done => {
    notificationObj.position = 'bc';
    component.addNotification(notificationObj);
    let notification = TestUtils.findRenderedDOMComponentWithClass(instance, 'notification') as HTMLElement;
    let bottomPosition = notification.style.bottom;
    expect(bottomPosition).to.equal('-100px');
    done();
  });

  it('should render containers with a overriden width for a specific position', done => {
    notificationObj.position = 'tl';
    component.addNotification(notificationObj);
    let notification = TestUtils.findRenderedDOMComponentWithClass(instance, 'notifications-tl')as HTMLElement;
    let width = notification.style.width;
    expect(width).to.equal('800px');
    done();
  });

  it('should throw an error if no level is defined', done => {
    // TODO - это грубый хак, но, с другой стороны, в TypeScript этот тест де-факто действительно лишний
    delete (notificationObj as any).level;
    expect(() => component.addNotification(notificationObj)).to.throw(/notification level is required/);
    done();
  });

  it('should throw an error if a invalid level is defined', done => {
    notificationObj.level = 'invalid';
    expect(() => component.addNotification(notificationObj)).to.throw(/is not a valid level/);
    done();
  });

  it('should throw an error if a invalid position is defined', done => {
    notificationObj.position = 'invalid';
    expect(() => component.addNotification(notificationObj)).to.throw(/is not a valid position/);
    done();
  });

  it('should throw an error if autoDismiss is not a number', done => {
    // TODO - это грубый хак, но, с другой стороны, в TypeScript этот тест де-факто действительно лишний
    (notificationObj as any).autoDismiss = 'string';
    expect(() => component.addNotification(notificationObj)).to.throw(/\'autoDismiss\' must be a number./);
    done();
  });

  it('should render 2nd notification below 1st one', done => {
    component.addNotification(merge({}, defaultNotification, {title: '1st'}));
    component.addNotification(merge({}, defaultNotification, {title: '2nd'}));

    const notifications = TestUtils.scryRenderedDOMComponentsWithClass(instance, 'notification');
    expect(notifications[0].getElementsByClassName('notification-title')[0].textContent).to.equal('1st');
    expect(notifications[1].getElementsByClassName('notification-title')[0].textContent).to.equal('2nd');
    done();
  });
});

// TODO - зарефакторить, чтобы не морочиться с ref-ами
class ElementWrapperOnTop extends Component {
  render() {
    return <NotificationSystem ref={ref} style={style} allowHTML={true} noAnimation={true} newOnTop={true}/>;
  }
}
describe('Notification Component with newOnTop=true', function () {
  let instance: ElementWrapperOnTop;
  let component: NotificationSystem;
  let clock: sinon.SinonFakeTimers | undefined;

  this.timeout(10000);

  beforeEach(() => {
    instance = TestUtils.renderIntoDocument(React.createElement(ElementWrapperOnTop));
    component = instance.refs[ref] as NotificationSystem;

    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock!.restore();
  });

  it('should render 2nd notification above 1st one', done => {
    component.addNotification(merge({}, defaultNotification, {title: '1st'}));
    component.addNotification(merge({}, defaultNotification, {title: '2nd'}));

    const notifications = TestUtils.scryRenderedDOMComponentsWithClass(instance, 'notification');
    expect(notifications[0].getElementsByClassName('notification-title')[0].textContent).to.equal('2nd');
    expect(notifications[1].getElementsByClassName('notification-title')[0].textContent).to.equal('1st');
    done();
  });
});
