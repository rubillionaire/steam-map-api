var Editable = require('../editable'),
    Checkmark = require('../ui/checkmark');

module.exports = function dropdownConditionalText () {
    var self = {},
        prev_valid = false,
        valid = false,
        root_selection,
        text_selection,
        editable_text,
        checkmark_sel,
        options,
        options_key,
        select_wrapper,
        select,
        select_options,
        placeholder,
        initial_value;

    self.dispatch = d3.dispatch('validChange');

    self.isValid = function () {
        return valid;
    };

    self.validatedData = function () {
        // if the editable text selection is
        // active, then you are looking at
        // something in the US, and should
        // return the value of the text field

        // otherwise, get the value from the drop down
        // to send back to the server
        if (text_selection.classed('active')) {
            return editable_text.value();
        } else {
            select.property('value');
        }
    };

    self.initialValue = function (x) {
        if (!arguments.length) return initial_value;
        initial_value = x;
        return self;
    };


    self.rootSelection = function (x) {
        if (!arguments.length) return root_selection;
        root_selection = x;
        return self;
    };

    self.placeholder = function (x) {
        if (!arguments.length) return placeholder;
        placeholder = x;
        return self;
    };

    self.options = function (x) {
        if (!arguments.length) return options;
        options = x;
        return self;
    };

    // function that gets values out of the options array
    self.optionsKey = function (x) {
        if (!arguments.length) return options_key;
        options_key = x;
        return self;
    };

    self.render = function () {
        // set the initial values for rendering
        var initial_text_selection_data,
            initial_edtiable_text,
            initial_value_select;

        options.forEach(function (d, i) {
            if (d.country === 'United States of America') {
                return;
            }
            // to make this reusable, you would
            // want to be able to set this function
            // dynamically.
            if (initial_value === d.country) {

                initial_text_selection_data = [{
                    active: false
                }];

                initial_edtiable_text = '';

                initial_value_select = d.country;
            }
        });

        // initial value is not in the options
        // field, so the value does not need to change
        if (!initial_text_selection_data) {
            
            initial_text_selection_data = [{
                active: true
            }];

            initial_edtiable_text = initial_value;

            initial_value_select = 'United States of America';
        }
        // end set the initial values for rendering

        // add validation visualization
        root_selection
            .call(Checkmark());
        checkmark_sel = root_selection.select('.checkmark');

        select_wrapper =
            root_selection
                .append('div')
                .attr('class', 'input-select');

        text_selection =
            root_selection
                .selectAll('.input-text')
                .data(initial_text_selection_data)
                .enter()
                .append('div')
                .attr('class', function (d) {
                    var active = d.active ? ' active' : '';
                    return 'input-text hide-til-active' + active;
                });


        editable_text = Editable()
                            .selection(text_selection)
                            .placeholder(placeholder)
                            .value(initial_edtiable_text)
                            .label({
                                type: 'p',
                                label: 'enter your zipcode'
                            })
                            .render();

        editable_text
            .dispatch
            .on('validChange', function () {
                validate();
            });


        select = select_wrapper
            .append('select')
            .on('change', function () {
                if (select.property('value') ===
                    'United States of America') {

                    text_selection
                        .classed('active', true);
                } else {
                    text_selection
                        .classed('active', false);
                }
                validate();
            });

        select
            .selectAll('option')
            .data(options)
            .enter()
            .append('option')
            .attr('value', options_key)
            .text(options_key)
            .property('value', options_key);

        // select initial
        select.property('value', initial_value_select);

        // set state based on render
        validate();

        return self;
    };

    function validate () {
        if ((editable_text.isValid() &&
             text_selection.classed('active')) ||
            (text_selection.classed('active') === false)) {

            valid = true;
        } else {
            valid = false;
        }

        checkmark_sel.classed('valid', valid);

        if (valid !== prev_valid) {
            self.dispatch
                .validChange.apply(this, arguments);
        }

        prev_valid = valid;

        return valid;
    }

    return self;
};