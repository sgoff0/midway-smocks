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
module.exports = {
  /*jshint multistr: true */
  ui: '(function() {\n\
    var Multiselect = React.createClass({\n\
      displayName: "MultiSelect",\n\
\n\
      getDefaultProps: function() {\n\
        return {value: [] };\n\
      },\n\
\n\
      render: function() {\n\
        var values = this.props.value || [];\n\
        var selections = _.map(this.props.options, function(option) {\n\
          var label = option;\n\
          var value = option;\n\
          if (typeof option !== "string") {\n\
            label = option.label;\n\
            value = option.value;\n\
          }\n\
          var selected = values.indexOf(value) >= 0;\n\
          return React.createElement(InputMultiSelectOption, { key: value, value: value, label: label, checked: selected,\n\
            onChange: this.onChange });\n\
        }, this);\n\
\n\
        return React.createElement(InputItemWrapper, { label: this.props.label, className: "input-multiselect" },\n\
          React.DOM.div({ className: "multiselect-list" }, selections)\n\
        );\n\
      },\n\
\n\
      onChange: function(id, checked) {\n\
        var values = this.props.value;\n\
        var index = values.indexOf(id);\n\
        if (checked && index === -1) {\n\
          values.push(id);\n\
        } else if (!checked && index >= 0) {\n\
          values.splice(index, 1);\n\
        }\n\
        this.props.onChange(values);\n\
      }\n\
    });\n\
\n\
    var InputMultiSelectOption = React.createClass({\n\
      displayName: "MultiSelectOption",\n\
\n\
      getInitialState: function () {\n\
        return { id: _.uniqueId("multiselect-") };\n\
      },\n\
\n\
      render: function() {\n\
        var id = this.state.id;\n\
        return React.DOM.div({ className: "inline field" },\n\
          React.DOM.div({ className: "ui checkbox" },\n\
            React.DOM.input({ id: id, type: "checkbox", className: "ui checkbox", checked: this.props.checked,\n\
              defaultValue: this.props.value, onChange: this.onChange }\n\
            ),\n\
            React.DOM.label({ htmlFor: id }, this.props.label)\n\
          )\n\
        )\n\
      },\n\
\n\
      onChange: function(ev) {\n\
        this.props.onChange(this.props.value, ev.currentTarget.checked);\n\
      }\n\
    });\n\
    return Multiselect;\n\
  })();'
};
