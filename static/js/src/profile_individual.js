var geoComponent =
        require('./formComponents/dropdownConditionalText'),
    radioComponent =
        require('./formComponents/radio'),
    textComponent =
        require('./formComponents/text'),
    textAreaComponent =
        require('./formComponents/textarea');

module.exports = function ProfileIndividual (context) {
    var self = {},
        selection,
        save_button,
        geo_options,
        data,
        prev_valid,
        valid;

    var first_name,
        last_name,
        email,
        geo,
        work_in,
        description,
        updatable = [],
        updated = [];

    self.selection = function (x) {
        if (!arguments.length) return selection;
        selection = x;
        return self;
    };

    self.geoOptions = function (x) {
        if (!arguments.length) return geo_options;
        geo_options = x;
        return self;
    };

    self.data = function (x) {
        // local copy of user data
        if (!arguments.length) return data;
        data = x;
        return self;
    };

    self.build = function () {
        selection.datum(data).call(build);

        // they start with the same value,
        // depend on futher validation
        // or changes to the dom to enable
        // the save button.
        prev_valid = valid = true;

        validate();

        return self;
    };

    function build (sel) {
        var row = sel.append('div')
                           .attr('class', 'row clearfix');

        var first_name_sel = row
            .append('div')
            .attr('class', 'column one');
        
        first_name = textComponent()
            .selection(first_name_sel)
            .placeholder('first name')
            .initialValue(
                data.objects[0].individual.first_name ?
                data.objects[0].individual.first_name : '')
            .render();

        var last_name_self = row
            .append('div')
            .attr('class', 'column one');

        last_name = textComponent()
            .selection(last_name_self)
            .placeholder('last name')
            .initialValue(
                data.objects[0].individual.last_name ?
                data.objects[0].individual.last_name : '')
            .render();

        var geo_sel = row
            .append('div')
            .attr('class', 'column two')
            .attr('id', 'individual-geo');

        geo = geoComponent()
            .rootSelection(geo_sel)
            .optionsKey(function (d) { return d.country; })
            .initialValue(data.objects[0].top_level_input)
            .placeholder('00000');

        if (context.countries.data()) {
            // if the data is loaded already,
            // populate the select_geo module
            geo.options(context.countries.data())
                .render();
        } else {
            // wait until it is loaded, and then
            // render based on results
            context
                .countries
                    .dispatch
                    .on('loaded.profile', function () {

                geo.options(context.countries.data())
                    .render();
            });
        }

        var work_in_sel = row
            .append('div')
            .attr('class', 'column two')
            .attr('id', 'individual-work-in');

        var work_in_options = [{
                    label: 'Research',
                    value: 'res',
                    selected: false
                }, {
                    label: 'Education',
                    value: 'edu',
                    selected: false
                }, {
                    label: 'Political',
                    value: 'pol',
                    selected: false
                }, {
                    label: 'Industry',
                    value: 'ind',
                    selected: false
                }];

        var work_in_initial;
        work_in_options.forEach(function (d, i) {
            if (d.label.toLowerCase() ===
                data.objects[0].work_in.toLowerCase()) {
                d.selected = true;
                work_in_initial = d;
            }
        });

        work_in = radioComponent()
            .node(work_in_sel)
            .label({
                label: 'I work in the following area',
                type: 'p',
                klass: ''
            })
            .groupName('individual-work-in-group')
            .initialSelected(work_in_initial)
            .data(work_in_options)
            .render();

        var description_sel = row
            .append('div')
            .attr('class', 'column two')
            .attr('id', 'individual-description');

        description = textAreaComponent()
            .selection(description_sel)
            .label({
                label: 'Why does STEAM matter to you?',
                type: 'p',
                klass: ''
            })
            .initialValue(
                data.objects[0].description ?
                data.objects[0].description : '')
            .render();

        save_button =
            row.append('div')
                .attr('class', 'column two')
                .append('p')
                .attr('class', 'large button')
                .text('Save');

        // turn on dispatch validation
        geo.dispatch
            .on('validChange.profile', function () {
                validate();
            })
            .on('valueChange.profile', function () {
                validate();
            });

        work_in.dispatch
            .on('valid.profile', function () {
                validate();
            });

        first_name.dispatch
            .on('valueChange.profile', function () {
                validate();
            });

        last_name.dispatch
            .on('valueChange.profile', function () {
                validate();
            });

        description.dispatch
            .on('valueChange.profile', function () {
                validate();
            });

        // manage updatable items.
        updatable.push({
            isDifferent: first_name.isDifferent,
            value: first_name.value,
            position_in_data: ['individual', 'first_name'],
            reset_initial: first_name.initialValue
        });
        updatable.push({
            isDifferent: last_name.isDifferent,
            value: last_name.value,
            position_in_data: ['individual', 'last_name'],
            reset_initial: last_name.initialValue
        });
        updatable.push({
            isDifferent: work_in.isDifferent,
            value: work_in.selected,
            position_in_data: ['work_in'],
            reset_initial: work_in.initialSelected
        });
        updatable.push({
            isDifferent: geo.isDifferent,
            value: geo.validatedData,
            position_in_data: ['top_level_input'],
            reset_initial: geo.initialValue
        });
        updatable.push({
            isDifferent: description.isDifferent,
            value: description.value,
            position_in_data: ['description'],
            reset_initial: description.initialValue
        });
    }

    function decorate_for_submittal (x) {
        x.id = data.objects[0].id;
        x.resource_uri = data.objects[0].resource_uri;
        if (x.individual) {
            x.individual.id = data.objects[0].individual.id;
        }

        return x;
    }

    function update_user_data () {
        // something should be updated

        // updated data to be sent to
        // the server for saving
        var data_for_server = {};

        updated.forEach(function (n, i) {
            if (n.position_in_data.length === 1) {

                data.objects[0][n.position_in_data[0]] =
                    n.value();

                data_for_server[n.position_in_data[0]] =
                    n.value();

            } else if (n.position_in_data.length === 2) {

                data.objects[0][n.position_in_data[0]]
                               [n.position_in_data[1]] =
                    n.value();

                // data for server may not have the correct
                // nested object to save against
                if (!data_for_server[n.position_in_data[0]]) {
                    data_for_server[n.position_in_data[0]] =
                        data.objects[0][n.position_in_data[0]];
                }

                data_for_server[n.position_in_data[0]]
                               [n.position_in_data[1]] =
                    n.value();
            }
            
        });
        // make those changes out
        // to the context.user module
        context.user.data(data);

        return data_for_server;
    }

    function reset_updatables_initial_data () {
        updated.forEach(function (n, i) {
            n.reset_initial(n.value());
        });
    }

    function save_flow () {
        var data_to_submit =
            decorate_for_submittal(update_user_data());

        // todo: stop editability

        context
            .api
            .steamie_update(data_to_submit,
                             function (err, response) {
            if (err){
                console.log('err');
                console.log(err);
                return;
            }
            
            console.log('do something with');
            console.log(response);

            var results = JSON.parse(response.responseText);
            console.log(results);

            reset_updatables_initial_data();
            // will reset the save button
            validate();
        });
    }

    function validate () {
        // deal with validation
        if (work_in.isValid() &&
            geo.isValid()) {
            valid = true;
        } else {
            valid = false;
        }

        // deal with updatable objects
        updated = [];
        updatable.forEach(function (n, i) {
            if (n.isDifferent()) {
                updated.push(n);
            }
        });

        // determine button functionality
        // based on validation and 
        // updatable object status
        if (updated.length > 0) {
            if (valid) {
                enable_save();
            } else {
                disable_save();
            }
        } else {
            disable_save();
        }

        prev_valid = valid;

        return valid;
    }

    function enable_save() {
        save_button
            .classed('enabled', true)
            .on('click', function () {
                save_flow();
            });
    }

    function disable_save () {
        save_button
            .classed('enabled', false)
            .on('click', null);
    }

    return self;
};