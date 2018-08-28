/**
* MIT License
*
* Copyright (c) 2018-present, Walmart Inc.,
*
* Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*
*/
var profileDomain = 'profiles-' + encodeURIComponent(data.id);
var profiles = (localStorage && JSON.parse(localStorage.getItem(profileDomain) || '{}')) || {};
var TABS = {
  fixtures: {
    label: 'Routes',
    tooltip: 'Control your routes configurations <ul><li>set active variant</li><li>set route and variant input values</li><li>execute route specific actions</li></ul>'
  }, config: {
    label: 'Admin',
    tooltip: 'Save profiles, set proxies, execute global actions and set global input values'
  }
};

var inputVersion = 1;
var api = {
  doPost: function(path, data, method, callback) {
    var successMessage = data && data.successMessage;
    var incrementState = data && data.incrementState;

    if (data.successMessage) {
      delete data.successMessage;
    }
    if (data.incrementState) {
      delete data.incrementState;
    }

    $.ajax({
      type: method || 'POST',
      url: '/midway/api' + path + '?returnConfig=true',
      processData: false,
      contentType: 'application/json',
      data: JSON.stringify(data || {}),
      error: function (req, type) {
        if (type === 'abort') {
          return showErrorMessage('smocks server is not running');
        }
        showErrorMessage('could not process your request');
      },
      success: function(_data) {
        if (incrementState) {
          inputVersion++;
        }
        if (callback) {
          callback(_data);
        } else {
          resetConfig(_data);
        }

        if (successMessage) {
          _.defer(function() {
            var message = _.isFunction(successMessage) ? successMessage(_data) : successMessage;
            if (message) {
              showSuccessMessage(message);
            }
          });
        }
      }
    });
  },

  executeAction: function(action, input, route) {
    this.doPost('/action', {
      action: action.id,
      route: route && route.id,
      input: input,
      successMessage: function(data) {
        return data._actionResponse || 'the action was successful';
      }
    }, 'POST');
  },

  proxyTo: function(val) {
    this.doPost('/proxy', {config: val});
  },

  selectVariant: function(routeId, variantId) {
    this.doPost('/route/' + encodeURIComponent(routeId), { variant: variantId });
  },

  selectValue: function(routeId, type, id, value) {
    var payload = {};
    var typePayload = {};
    payload[type] = typePayload;
    typePayload[id] = value;

    this.doPost('/route/' + encodeURIComponent(routeId), {
      input: payload
    });
  },

  globalInputChange: function(pluginId, id, value) {
    this.doPost('/global/input/' + encodeURIComponent(pluginId), {
      id: id,
      value: value
    });
  },

  resetState: function() {
    this.doPost('/state/reset', {
      successMessage: function() {
        return 'The state has been reset';
      },
      incrementState: true
    });
  },

  resetInput: function() {
    this.doPost('/input/reset', {
      successMessage: function() {
        return 'The fixture settings have been reset';
      },
      incrementState: true
    });
  },

  loadProfile: function(profile) {
    if (profile.type === 'remote') {
      this.doPost('/profile/' + encodeURIComponent(profile.name), {
        incrementState: true
      }, 'POST', function(data) {
        React.unmountComponentAtNode(document.body);
        resetConfig(data);
        showSuccessMessage(profile.name + '" was applied');
      });
    } else {
      var _profile = this.getLocalProfile(profile.name);
      if (_profile) {
        this.doPost('/profile', _profile, 'POST', function(data) {
          React.unmountComponentAtNode(document.body);
          resetConfig(data);
          showSuccessMessage(profile.name + '" was applied');
        });
      } else {
        showErrorMessage('invalid profile');
      }
    }
  },

  getLocalProfileNames: function() {
    var rtn = [];
    _.each(profiles, function(profile, name) {
      rtn.push(name);
    });
    return rtn;
  },

  getLocalProfile: function(name) {
    return profiles[name];
  },

  saveLocalProfile: function(name) {
    profiles[name] = this.toProfileData();
    localStorage.setItem(profileDomain, JSON.stringify(profiles));
    showSuccessMessage('profile "' + name + '" was saved');
  },

  deleteLocalProfile: function(profile) {
    delete profiles[profile.name];
    localStorage.setItem('profiles', JSON.stringify(profiles));
    showSuccessMessage('profile "' + profile.name + '" was deleted');
  },

  toProfileData: function() {
    var toSave = {};
    _.each(data.routes, function(route) {
      toSave[route.id] = {
        activeVariant: route.activeVariant,
        selections: route.selections
      };
    });
    return toSave;
  }
};

function resetConfig(_data, input) {
  data = _data;
  input = _.defaults({}, { routes: data.routes }, input);
  React.render(React.createElement(AdminPage, input), document.getElementById('content'));
}



var INPUT_TYPES = {};
_inputs(INPUT_TYPES);


/*****************************************************
 * VIEW COMPONENTS
 ***/

/**************************************************************************
 *  ROUTE STYLE CONTROLLER
 **************************************************************************/
var RouteStyleController = React.createClass({
  displayName: 'RouteStyleController',

  render: function () {
    var style = this.props.style;

    return (
      <div className="ui secondary pointing menu">
      <a className="item">
      Show by
    </a>
    <a href="#" className={'item ' + (style === 'label' && 'active green')} onClick={this.changeStyle('label')}>
    Label
    </a>
    <a href="#" className={'item ' + (style === 'path' && 'active green')} onClick={this.changeStyle('path')}>
    Route Path
    </a>

    <div className="menu filter-container">
      <div className="ui icon input">
      <input type="text" className="filter-input" placeholder="Search..." onChange={this.onFilter} value={this.props.filterValue}/>
    <i className="search link icon"></i>
      </div>
      </div>
      </div>
    );
  },

  onFilter: function (ev) {
    this.props.onFilter(ev.currentTarget.value);
  },

  changeStyle: function (type) {
    var self = this;
    return function (ev) {
      ev.preventDefault();
      self.props.onStyleChange(type);
    }
  }
});

var TipButton = React.createClass({
  getInitialState: function () {
    return {};
  },

  componentDidMount: function () {
    var el = $(this.getDOMNode());
    this.state.tip = new Opentip(el, this.props['data-tip'], {
      showOn: 'mouseover'
    })
  },

  componentWillUnmount: function () {
    this.state.tip.deactivate();
  },

  render: function () {
    return <button {...this.props}>{this.props.children}</button>
  }
});

/**************************************************************************
 *  Group Menu
 **************************************************************************/
var RouteGroupMenu = React.createClass({
  displayName: 'RouteGroupMenu',
  render: function () {
    var selectedGroup = this.props.selectedGroup || 'All';
    var routes = this.props.routes;
    var onSelectGroup = this.props.onSelectGroup;
    var groups = {};
    _.each(routes, function (route) {
      if (route.group) {
        var count = groups[route.group] || 0;
        groups[route.group] = count + 1;
      }
    });
    var groupsArr = _.map(groups, function (count, name) {
      return {name: name, count: count};
    });


    if (groupsArr.length) {
      if (groupsArr.length === 1) {
        if (groupsArr[0].count !== routes.length) {
          groupsArr.unshift({name: 'All', count: routes.length});
        } else if (groupsArr[0].count === 1) {
          return <div/>;
        }
      } else {
        groupsArr.unshift({name: 'All', count: routes.length});
      }
    } else {
      return <div/>;
    }

    return (
      <div className="ui compact menu group-menu">
      {_.map(groupsArr, function (data) {
        function onClick () {
          onSelectGroup(data.name === 'All' ? undefined : data.name);
        }
        return (
          <a className="item" onClick={onClick}>
          {data.name}
        <div key={data.name} className={'ui label' + (selectedGroup === data.name ? ' blue' : '')}>{data.count}</div>
        </a>
        );
      })}
    </div>
    );
  }
});

/**************************************************************************
 *  TAB PANEL
 **************************************************************************/
var TabPanel = React.createClass({
  displayName: 'TabPanel',
  getInitialState: function () {
    return {index: 'standard'}
  },

  render: function () {
    var selected = this.props.selected;
    var tabs = this.props.tabs;

    return (
      <div className="tab-container">
      <div className="tab-action-buttons">
      <TipButton type="button" data-content="hello" className="reset-button" onClick={_.bind(api.resetState, api)}
    data-tip="Reset any changes made in your application <br/><br/> <b>any changes made in this admin panel will remain</b>">
      Reset State
    </TipButton>
    <TipButton type="button" className="reset-button" onClick={_.bind(api.resetInput, api)}
    data-tip="Reset any changes made in this admin panel <br/><br/> <b>any changes changes you have made in your app will remain</b>">
      Reset Route Settings
    </TipButton>
    </div>

    <div className="ui top attached tabular menu">
      {_.map(tabs, function (data, key) {
        var self = this;
        var label = data.label;
        var tooltip = data.tooltip;
        function onClick () {
          self.props.onSelect(key);
        }
        return (
          <TipButton key={key} data-tip={tooltip} type="button" className={'item ' + (selected === key && 'active green')} onClick={onClick}>
          {label}
          </TipButton>
        );
      }, this)}
    </div>
    <div style={{padding: '12px'}}>
    {this.props.children}
    </div>
    </div>
    );
  }
})


/**************************************************************************
 *  ROUTE LIST PANEL
 **************************************************************************/
var RouteListPanel = React.createClass({
  displayName: 'RouteListPanel',

  render: function () {
    var routeSpecific = false;
    var props = this.props;
    var filter = props.filter;
    var routes = props.routes;
    var viewType = props.viewType;
    var selectedRoute = props.selectedRoute;
    var selectedGroup = props.selectedGroup;

    var match = filter.match(/(POST|GET|PUT|DELETE|PATCH) \"([^\"]+)\"/);
    if (match) {
      routeSpecific = {
        method: match[1],
        path: match[2]
      }
    }

    var _routes = _.compact(_.map(routes, function(route) {
      var valid = true;
      if (routeSpecific) {
        valid = route.method === routeSpecific.method && route.path === routeSpecific.path;
      } else {
        var filterContent = (route.label || '') + ' ' + route.path + ' ' + route.method;
        var filters = filter.split(' ');

        _.each(filters, function(filter) {
          if (valid && filter) {
            var match = new RegExp(filter, 'i');
            if (filter && !filterContent.match(match)) {
              valid = false;
            }
          }
        });
      }
      return valid && route;
    }));

    _routes.sort(function(routeA, routeB) {
      var compA, compB;
      if (viewType === 'label') {
        compA = routeA.label || (routeA.path + ':' + routeA.method);
        compB = routeB.label || (routeB.path + ':' + routeB.method);
      } else {
        compA = routeA.path + ':' + routeA.method;
        compB = routeB.path + ':' + routeB.method;
      }
      return (compA > compB) ? 1 : -1;
    });

    return (
      <div>
      <RouteGroupMenu onSelectGroup={this.props.onSelectGroup} routes={_routes} selectedGroup={selectedGroup}/>
      <div>
      {_.map(_routes, function(route) {
        if (!selectedGroup || route.group === selectedGroup) {
          return <Route key={route.id} route={route} selected={selectedRoute === route.id || _routes.length === 1}
          onSelect={this.props.onSelectRoute} onDeselect={this.props.onDeselectRoute} viewType={viewType}/>
        }
      }, this)}
    </div>
    </div>
    );
  }
});


/**************************************************************************
 *  ADMIN PAGE
 **************************************************************************/
var AdminPage = React.createClass({
  displayName: 'AdminPage',

  getInitialState: function() {
    var hash = (window.location.hash || '').replace('#', '').split('/');
    return {
      filter: decodeURIComponent(hash[1] || ''),
      viewType: decodeURIComponent(hash[0] || 'label'),
      viewScope: this.props.viewScope || 'fixtures',
      'profileState': _.uniqueId('profileState-')
    };
  },

  render: function() {
    var selectedRoute = this.state.selectedRoute;
    var selectedProfile = this.state.selectedProfile;
    var filter = this.state.filter;
    var viewType = this.state.viewType;
    var viewScope = this.state.viewScope;
    var selectedGroup = this.state.selectedGroup;

    var body;
    if (viewScope === 'fixtures') {
      body = (
        <div>
        <RouteStyleController style={viewType} onStyleChange={this.onStyleChange} onFilter={this.onFilter} filterValue={filter}/>
        <div className="routes">
        <RouteListPanel selectedGroup={selectedGroup} routes={this.props.routes} filter={filter} viewType={viewType} selectedRoute={selectedRoute}
      onSelectRoute={this.onSelectRoute} onDeselectRoute={this.onDeselectRoute} onSelectGroup={this.onSelectGroup}/>
    </div>
      </div>
    );
    } else if (viewScope === 'config') {
      body = (
        <div>
        {[<ConfigTab ref="profiles" key={this.state.profileState} selected={selectedProfile} remoteConfigComplete={this.remoteProfileConfigComplete}
      onSelectProfile={this.onSelectProfile} onSaveProfile={this.onSaveProfile} onLoadProfile={this.onLoadProfile}
      onDeleteProfile={this.onDeleteProfile} onCancelProfileAction={this.onCancelProfileAction} remoteConfig={this.state.remoteConfig}/>
    ]}
    </div>
    );
    }

    return (
      <div>
      <a href="https://github.com/TestArmada/midway" className="logo">Midway</a>
      <TabPanel tabs={TABS} selected={viewScope} onSelect={this.setViewScope}>
    {body}
    </TabPanel>
    </div>
    );
  },

  setViewScope: function (key) {
    this.setState({
      viewScope: key
    });
  },

  onSelectGroup: function (group) {
    this.setState({
      selectedGroup: group
    });
  },

  onStyleChange: function (type) {
    this._updateHash(type, this.state.filter);

    this.setState({
      viewType: type
    });
  },

  onCancelProfileAction: function() {
    this.setState({
      profileState: _.uniqueId('profileState-'),
      selectedProfile: undefined
    });
  },

  remoteProfileConfigComplete: function() {
    this.setState({
      remoteConfig: undefined,
      profileState: _.uniqueId('profileState-')
    });
  },

  onSelectProfile: function(profile) {
    this.setState({
      selectedProfile: profile
    });
  },

  onLoadProfile: function(profile) {
    api.loadProfile(profile);
    this.refs.profiles.reset();
    this.setState({
      selectedProfile: undefined
    });
  },

  onSaveProfile: function(profile) {
    if (profile.type === 'remote') {
      this.setState({remoteConfig: "smocks.profile(" + JSON.stringify(profile.name) + ", " + JSON.stringify(api.toProfileData()) + ");"});
    } else {
      api.saveLocalProfile(profile.name);
      this.forceUpdate();
    }
  },

  onDeleteProfile: function(profile) {
    api.deleteLocalProfile(profile);
    this.refs.profiles.reset();
    this.setState({
      selectedProfile: undefined
    });
  },

  onFilter: function(value) {
    this.setState({ filter: value });

    this._updateHash(this.state.viewType, value);
  },

  _updateHash: function(viewType, filter) {
    var hash = encodeURIComponent(viewType);
    if (filter) {
      hash = hash + '/' + encodeURIComponent(filter);
    }
    if (window.location.hash != hash) {
      window.location.hash = hash;
    }
  },

  onSelectRoute: function(route) {
    this.setState({
      selectedRoute: route.id
    });
  },

  onDeselectRoute: function(route) {
    if (route.id === this.state.selected) {
      this.setState({
        selected: undefined
      });
    }
  },

  resetState: function() {
    api.resetState();
  }
});

var Actions = React.createClass({
  displayName: 'Actions',

  getInitialState: function() {
    return {};
  },

  render: function() {
    var self = this;
    var pendingAction = this.state.pendingAction;
    var pendingActionDetails;
    var route = this.props.route;

    var actions = !pendingAction && _.map(this.props.actions, function(action) {
        var onClick = function() {
          var hasInput = false;
          var pendingInputValues = {};
          _.each(action.input, function(data, id) {
            hasInput = true;
            pendingInputValues[id] = data.defaultValue;
          });
          if (hasInput) {
            self.setState({
              pendingAction: action,
              pendingInputValues: pendingInputValues
            });
          } else {
            // just execute the action
            api.executeAction(action, pendingInputValues, route);
          }
        };

        return <button key={action.id} type="button" className="ui fluid green button" onClick={onClick}>{action.label || action.id}</button>
      }, this);

    if (pendingAction) {
      var pendingActionLabel = pendingAction.label || pendingAction.id;
      var values = {};
      _.each(pendingAction.input, function(data, id) {
        values[id] = data.defaultValue;
      });
      pendingActionDetails = (
        <div className="pending-action-details">
        <div className="pending-action-message">
        <h5>{pendingActionLabel}</h5>
        <div className="ui form">
        <InputList data={pendingAction.input} values={values} onChange={this.onInputChange}/>
    <div className="pending-action-actions">
        <button type="button" className="ui default green button" onClick={this.executeAction}>Execute</button>
      <button type="button" className="ui red button" onClick={this.cancelAction}>Cancel</button>
      </div>
      </div>
      </div>
      </div>
    );
    }

    return React.DOM.div({className: 'actions'},
      actions,
      pendingActionDetails
    );
  },

  onInputChange: function(id, value) {
    this.state.pendingActionValues[id] = value;
  },

  executeAction: function() {
    var action = this.state.pendingAction;
    if (this.state.pendingAction) {
      api.executeAction(this.state.pendingAction, this.state.pendingActionValues, this.props.route);
      this.setState({
        pendingAction: undefined,
        pendingActionValues: undefined
      });
    }
  },

  cancelAction: function() {
    this.setState({
      pendingAction: undefined,
      pendingActionValues: undefined
    });
  }
});

var Button = React.createClass({
  displayName: 'Button',
  render: function () {
    var method = this.props.method;
    var classColor = method.toLowerCase() + ' http-method-button';
    return(
      <button className={classColor}>
      {method}
      </button>
    );
  }
});

var routeColors = {
  GET: 'yellow',
  POST: 'blue',
  DELETE: 'red',
  PATCH: 'brown',
  PUT: 'violet'
};
var Route = React.createClass({
  displayName: 'Route',

  getInitialState: function() {
    return {
      selected: this.findActive()
    };
  },

  render: function() {
    var route = this.props.route,
      activeVariant = this.findActive(),
      title = this.props.viewType === 'label' ? (route.label || route.path) : route.path,
      actions, display;
    var messageColor = routeColors[route.method];
    var numInputEntries = countProperties(route.input) + countProperties(activeVariant.input);
    var httpMethodColor = route.method.toLowerCase() + '-color';
    var boxBackgroundColor = route.method.toLowerCase() + '-box';
    if (route.display) {
      var converter = new showdown.Converter();
      display = React.DOM.div({className: 'route-display info', dangerouslySetInnerHTML: {__html: converter.makeHtml(route.display)}});
    }

    if (route.actions.length > 0) {
      actions = React.createElement(Actions, { actions: route.actions, route: route });
    }

    if (this.props.selected) {
      var variants = _.map(route.variants, function(variant) {
        return <Variant key={variant.id} variant={variant} selected={variant.id === activeVariant.id} onSelect={this.selectVariant}/>;
      }, this);

      var isLabelType = this.props.viewType === 'label';
      var endpointLabel = isLabelType ? React.DOM.div({className: 'route-label'}, 'Path') : undefined;
      var button = <Button/>;

      return (
        <div onClick={this.onDeselect} className={httpMethodColor + ' ' + boxBackgroundColor + ' label box message route-description selected'}>
        <div><Button method={route.method}/></div>
      <h3> {title}</h3>

      <a alt="permalink" className="ui icon permalink primary button" target="_blank" href={'#' + this.props.viewType + '/' + route.method + '%20' + encodeURIComponent('"' + route.path + '"')}>
        <i className="bookmark icon"></i>
        </a>
        {(route.method === 'GET') && (
        <button type="button" className="ui icon view-endpoint primary button" onClick={this.viewEndpoint}>
    <i className="unhide icon"></i>
        </button>
    )}

    <div className="route-description-body">
        <div className="ui grid">

        <div className="ten wide column">
        <h5>Details</h5>
        <div className="ui form">
        <div className="inline field">
        <label>Route Id</label>
      {route.id}
    </div>
      <div className="inline field">
        <label>Active Variant Id</label>
      {activeVariant.id}
    </div>
      {isLabelType && (
      <div className="inline field">
        <label>Path</label>
        {route.path}
    </div>
    )}
    </div>

      <h5>Response Handling</h5>
      <div className="variants">
        {variants}
        </div>

        {display && (
        <div className="route-specific-details">
        <h5>Fixture specific details</h5>
      <div className="ui message">
        {display}
        </div>
        </div>
    )}
    </div>

      <div className="six wide column">
        <h5>Configuration</h5>
        {!numInputEntries && 'No configuration entries are available'}
    <InputList data={route.input} values={route.selections && route.selections.route || {}} onChange={this.onChange('route')}/>
    <InputList data={activeVariant.input} values={route.selections && route.selections.variants && route.selections.variants[activeVariant.id]}
      onChange={this.onChange('variant')}/>

    <h5>Actions</h5>
      {!route.actions.length && 'No actions are available'}
      {actions}
    </div>

      </div>
      </div>
      </div>
    );
    } else {
      var button = <Button/>;

      return (
        <div onClick={this.onSelect} className={httpMethodColor + ' ' + boxBackgroundColor + ' label get-box box message closed route-description'}>
        <div><Button method={route.method}/></div>
      <div>
      <h3>{title}</h3>
      </div>
      </div>
    );
    }
  },

  viewEndpoint: function(ev) {
    ev.preventDefault();
    var path = this.props.route.path.replace(/\{[^\}]+}/g, function(val) {
      val = val.substring(1, val.length-1);
      var response = prompt('Enter the value for "' + val + '"');
      return response || val;
    });
    window.open(path, path);
  },

  onDeselect: function() {
    this.props.onDeselect(this.props.route);
  },

  onSelect: function() {
    this.props.onSelect(this.props.route);
  },

  onChange: function(type) {
    var route = this.props.route;
    return function(id, value) {
      api.selectValue(route.id, type, id, value);
    };
  },

  findActive: function() {
    var id = this.props.route.activeVariant;

    var match = _.find(this.props.route.variants, function(variant) {
      return variant.id === id;
    });
    if (!match) {
      match = _.find(data.variants, function(variant) {
        return variant.id === id;
      });
    }
    return match;
  },

  selectVariant: function(id) {
    var route = this.props.route;
    route.activeVariant = id;

    api.selectVariant(route.id, id);
    this.forceUpdate();
  }
});


var Variant = React.createClass({
  displayName: 'Variant',

  getInitialState: function() {
    return { id: _.uniqueId('variant') };
  },

  render: function() {
    var id = this.state.id;
    var variant = this.props.variant;
    var label = variant.label || variant.id;
    var selected = this.props.selected;
    var className = selected ? 'btn btn-primary active' : 'btn btn-secondary';

    return (
      <button type="button" title={label} className={selected ? 'active-variant-button' : 'inactive-variant-button'} onClick={this.onClick}>
    {label}
    </button>
    );
  },

  onClick: function() {
    this.props.onSelect(this.props.variant.id);
  }
});


var InputItemWrapper = React.createClass({
  displayName: 'InputItemWrapper',

  render: function() {
    return <div className={'field ' + (this.props.className || '')}>
      <label htmlFor={this.props.id}>{this.props.label || this.props.id}</label>
    {this.props.children}
    </div>
  }
});


var UndefinedInput = React.createClass({
  render: function() {
    return React.DOM.div({}, 'Undefined input type ' + this.props.type + ' for ' + this.props.id);
  }
});


var InputList = React.createClass({
  displayName: 'InputList',

  render: function() {
    var self = this;
    var inputData = this.props.data;
    var values = this.props.values;

    var children = _.map(inputData, function(data, id) {
      var Input = INPUT_TYPES[data.type];
      if (!Input) {
        return <UndefinedInput ref={id} id={id} type={data.type}/>
      }
      data = _.clone(data);
      var value = values && values[id];
      if (_.isUndefined(value)) {
        value = data.defaultValue;
      }
      data.value = value;
      data.key = id;
      data.ref = id;
      data.onChange = function(value) {
        self.props.onChange(id, value);
      };
      return <Input {...data}/>
    });
    return <form className="ui form">{[<div key={inputVersion}>{children}</div>]}</form>;
  }
});

var DisplaySelectorChoice = React.createClass({
  displayName: 'DisplaySelectorChoice',

  getInitialState: function() {
    return {
      id: _.uniqueId('form')
    };
  },

  render: function() {
    return <span className="display-selector-choice">
      <input id={this.state.id} type="radio" checked={this.props.selected} onChange={this.props.onSelect}/>
    <label htmlFor={this.state.id}>{this.props.label}</label>
    </span>;
  }
});

var ConfigTab = React.createClass({
  displayName: 'ConfigTab',

  render: function() {
    var chooseProfile;
    var selected = this.props.selected;
    var remoteConfig;
    var localProfiles = api.getLocalProfileNames();
    var hasProfiles = !_.isEmpty(data.profiles) || !_.isEmpty(localProfiles);

    if (!_.isEmpty(data.profiles) || !_.isEmpty(localProfiles)) {
      var choices = [React.DOM.option({key: '_blank', value: ''}, 'select profile')];
      _.each(localProfiles, function(name) {
        choices.push(React.DOM.option({key:'local:' + name, value: 'local:' + name}, name));
      });
      _.each(data.profiles, function(name) {
        choices.push(React.DOM.option({key:'remote:' + name, value: 'remote:' + name}, name));
      });

      var loadProfile = selected && React.DOM.button({type: 'button', className: 'ui primary green button',
          onClick: this.loadProfile}, 'Apply ' + selected.name);
      var deleteProfile = selected && selected.type === 'local' && React.DOM.button({type: 'button', className: 'ui red button',
          onClick: this.deleteProfile}, 'Delete');
      var cancelProfile = selected && React.DOM.button({type: 'button', className: 'ui red basic button',
          onClick: this.cancelProfileAction}, 'Cancel');
    }

    if (this.props.remoteConfig) {
      remoteConfig = React.DOM.div({className: 'profile-remote-config'},
        React.DOM.div({className: 'profile-remote-config-info'}, 'Copy and paste to your smocks setup code to save the profile'),
        React.DOM.textarea({className: 'profile-remote-content form-control', value: this.props.remoteConfig, readOnly: true}),
        React.DOM.div({className: 'profile-remote-config-actions'},
          React.DOM.button({type: 'button', className: 'ui primary button', onClick: this.remoteConfigComplete}, "I'm done")
        )
      );
    }

    return (
      <div className="ui two columns grid">
      <div className="column">
      <h4>Profiles</h4>
      {hasProfiles && (
      <form className="ui form">
      <div className="field">
      <label htmlFor="profile-selector">Load / delete profile</label>
      <select id="profile-selector" ref="select" className="ui fluid dropdown" onChange={this.selectProfile}>
    {choices}
    </select>
    </div>
    {loadProfile}
    {deleteProfile}
    {cancelProfile}
    </form>
    )}

    <form className="ui form">
      <div className="field">
      <label htmlFor="profile-entry">
      Save current fixture configuration as
    </label>
    <input ref="profileName" onChange={this.setProfile} placeholder="Profile Name"/>
      <div className="ui two buttons">
      <button type="button" className="ui green button" onClick={this.saveProfile('local')}>for me</button>
                                                                                                <div className="or"/>
      <button type="button" className="ui blue button" onClick={this.saveProfile('remote')}>for everyone</button>
                                                                                                </div>
                                                                                                </div>
                                                                                                {remoteConfig}
                                                                                                </form>

                                                                                                {data.proxies && (
    <div>
    <h4>Proxy To</h4>
    <Proxy/>
    </div>
    )}

    </div>

    <div className="column">
      <h4>Global Input</h4>
    <div>
    {_.map(data.globalInput, function(input) {
      return React.createElement(InputList, { key: input.id, data: input.input, values: data.globalInputValues[input.id],
        onChange: this.onPluginInputChange(input.id) });
    }, this)}
    </div>

    <h4>Actions</h4>
    <div>
    <Actions actions={data.actions}/>
    {!data.actions.length && 'There are no global actions'}
    </div>
    </div>
    </div>
    );
  },

  onPluginInputChange: function(pluginId) {
    return function(id, value) {
      api.globalInputChange(pluginId, id, value);
    };
  },

  remoteConfigComplete: function() {
    this.props.remoteConfigComplete();
    this.refs.profileName.getDOMNode().value = '';
  },

  reset: function() {
    this.refs.select.getDOMNode().selectedIndex = 0;
  },

  selectProfile: function(ev) {
    var profile = ev.currentTarget.value;
    var match  = profile.match(/^([^:]*):(.*)$/);

    this.props.onSelectProfile({
      type: match[1],
      name: match[2]
    });
  },

  cancelProfileAction: function(ev) {
    this.props.onCancelProfileAction();
  },

  loadProfile: function(ev) {
    this.props.onLoadProfile(this.props.selected);
  },

  deleteProfile: function(ev) {
    this.props.onDeleteProfile(this.props.selected);
  },

  saveProfile: function(type) {
    var self = this;
    return function() {
      var profileName = self.refs.profileName.getDOMNode().value;
      if (!profileName) {
        return showErrorMessage('You must enter a profile name');
      }

      self.refs.profileName.getDOMNode().value = '';
      self.props.onSaveProfile({
        type: type,
        name: profileName
      });
    };
  }
});

function countProperties(obj) {
  var rtn = 0;
  _.each(obj, function () {
    rtn++;
  });
  return rtn;
}

var Proxy = React.createClass({
  render: function () {
    var proxyTo = data.selectedProxy;
    var proxies = data.proxies;

    return (
      <div className="grouped fields">
      <div className="field">
      <div className="ui radio checkbox">
      <input id="proxy_none" type="radio" name="fruit" checked={!proxyTo} className="hidden" onChange={this.proxyTo()}/>
    <label htmlFor="proxy_none">Do not proxy</label>
    </div>
    </div>
    {_.map(proxies, function (val) {
      return (
        <div key={val} className="field">
        <div className="ui radio checkbox">
        <input id={'proxy=' + val} type="radio" name="fruit" checked={proxyTo === val} className="hidden" onChange={this.proxyTo(val)}/>
      <label htmlFor={'proxy=' + val}>{val}</label>
        </div>
        </div>
      );
    }, this)}
    </div>
    );
  },

  proxyTo: function (config) {
    var self = this;
    return function () {
      api.proxyTo(config);
    }
  }
});

var Message = React.createClass({
  displayName: 'Message',

  render: function () {
    var type = this.props.type;
    var icon = type === 'success' ? 'checkmark' : 'warning sign';
    return (
      <div className={'ui icon message ' + type}>
      <i className={'small icon ' + icon}></i>
      <div className="content">
      <p id="info-message-content">{this.props.message}</p>
    </div>
    </div>
    );
  }
})

function showSuccessMessage(message) {
  showMessage('success', message);
}

function showErrorMessage(message) {
  showMessage('error', message);
}

function showMessage(type, message) {
  var wrapper = document.getElementById('message');
  React.render(React.createElement(Message, { type: type, message: message }), wrapper);

  wrapper.className = 'visible';
  setTimeout(function() {
    wrapper.className = 'fading';
    setTimeout(function() {
      wrapper.className = '';
      React.unmountComponentAtNode(wrapper);
    }, 1000);
  }, 1000);
}

React.render(React.createElement(AdminPage, { routes: data.routes }), document.getElementById('content'));
