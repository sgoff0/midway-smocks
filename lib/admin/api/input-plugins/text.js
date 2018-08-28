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
  ui: 'React.createClass({\n\
    displayName: "Textbox",\n\
\n\
    getInitialState: function() {\n\
      return {\n\
        onChange: _.debounce(function(value, onChange) {\n\
          onChange(value);\n\
        }, 1000)\n\
      };\n\
    },\n\
\n\
    render: function() {\n\
      return React.createElement(InputItemWrapper, { id: this.props.id, label: this.props.label, className: "input-text" },\n\
        React.DOM.input({ ref: "input", id: \'input-\' + this.props.id, className: "form-control", type: "text", name: this.props.id,\n\
          defaultValue: this.props.value, onChange: this.onChange })\n\
      );\n\
    },\n\
\n\
    onChange: function(ev) {\n\
      var value = this.refs.input.getDOMNode().value;\n\
      if (this.props.value !== value) {\n\
        this.state.onChange(value, this.props.onChange);\n\
      }\n\
    }\n\
  });'
};
