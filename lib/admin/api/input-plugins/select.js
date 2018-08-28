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
    displayName: "Select",\n\
\n\
    render: function() {\n\
      var defaultValue;\n\
      var options = _.map(this.props.options, function(data, index) {\n\
        var label = value;\n\
        var value = data;\n\
        if (typeof data !== "string") {\n\
          label = data.label;\n\
          value = data.value;\n\
        }\n\
        if (this.props.value === value) {\n\
          defaultValue = index + "";\n\
        }\n\
        return React.DOM.option({ key: label, value: index + "" }, label);\n\
      }, this);\n\
\n\
      return React.createElement(InputItemWrapper, { id: \'input-\' + this.props.id, label: this.props.label },\n\
        React.DOM.select({ id: this.props.id, className: "ui dropdown", name: this.props.id, defaultValue: defaultValue,\n\
          onChange: this.onChange }, options)\n\
      );\n\
    },\n\
\n\
    onChange: function(ev) {\n\
      var el = ev.currentTarget;\n\
      var index = el.options[el.selectedIndex].value;\n\
      this.props.onChange(this.props.options[parseInt(index, 10)].value);\n\
    }\n\
  });'
};
