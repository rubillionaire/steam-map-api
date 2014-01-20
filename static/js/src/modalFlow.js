var validator = require('./validators'),

    geoComponent =
        require('./formComponents/dropdownConditionalText'),

    radioComponent =
        require('./formComponents/radio'),

    socialAuthComponent =
        require('./formComponents/socialAuthSelection');

module.exports = ModalFlow;

function ModalFlow (context) {
    var form = {},
        state,              // current state
        previous_state,     // previous state
        input_data,         // object that tracks input data
        child_window,       // ref to the popup window object
        child_status;       // set interval function to check

    // form components
    var social_auth =
            socialAuthComponent(context)
                .node(d3.select('#add-yourself-login')),

        select_geo =
            geoComponent()
                .rootSelection(d3.select('#add-yourself-geo'))
                .optionsKey(function (d) { return d.country; })
                .placeholder('00000')
                .initialValue(null),

        select_type =
            radioComponent()
                .node(d3.select('#select-type-component'))
                .groupName('steamie_type')
                .data([{
                    label: 'Individual',
                    value: 'i',
                    selected: false
                }, {
                    label: 'Institution',
                    value: 'g',
                    selected: false
                }]),

        select_work_in =
            radioComponent()
                .node(d3.select('#select-work-in-component'))
                .label({
                    label: 'I work in the following area',
                    type: 'p',
                    klass: ''
                })
                .groupName('steamie_work_in')
                .data([{
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
                }]),

        profile_link_selection = d3.select('.profile-link');

    var ui = {
        popup_window_properties: function () {
            var cur_window = {};
            if (window.screenX) {
                cur_window.x = window.screenX;
                cur_window.y = window.screenY;
            } else {
                cur_window.x = window.screenLeft;
                cur_window.y = window.screenTop;
            }

            if (document.documentElement.clientHeight) {
                cur_window.height = document
                                    .documentElement
                                    .clientHeight;
                cur_window.width = document
                                    .documentElement
                                    .clientWidth;
            } else {
                cur_window.height = window.innerHeight;
                cur_window.width = window.innerWidth;
            }

            cur_window.x += 50;
            cur_window.y += 50;
            cur_window.height -= 100;
            cur_window.width -= 100;

            return cur_window;
        }
    };

    // elements that need to be turned on and off
    var el = {
        button: {
            close_modal: {
                el: d3.select('#close-modal'),
                on_click: function () {
                    form.state('inactive_no_profile');
                },
                append_to_el: function (sel) {
                    var button_size = 45;

                    // add the closing x as svg
                    sel.append('svg')
                        .attr('width', button_size)
                        .attr('height', button_size)
                        .selectAll('line')
                        .data([
                            { x1: 0, y1: 0,
                              x2: button_size, y2: button_size },
                            { x1: button_size, y1: 0,
                              x2: 0, y2: button_size }
                        ])
                        .enter()
                        .append('line')
                            .attr('x1', function (d) {
                                return d.x1;
                            })
                            .attr('y1', function (d) {
                                return d.y1;
                            })
                            .attr('x2', function (d) {
                                return d.x2;
                            })
                            .attr('y2', function (d) {
                                return d.y2;
                            })
                            .attr('stroke-width', 1)
                            .attr('stroke', 'white');
                }
            },

            back: {
                el: d3.select('#back-modal-add-yourself'),
                on_click: function () {
                    form.state(previous_state);
                },
                append_to_el: function () {}
            },

            open_modal: {
                el: d3.select('#activate-add-yourself'),
                on_click: function () {
                    if (previous_state === 'inactive_no_profile') {
                        // first time through
                        form.state('call_to_action');
                    } else {
                        form.state(previous_state);
                    }
                },
                append_to_el: function () {}
            },

            add_me: {
                el: d3.select('#add-me-button'),
                on_click: function () {},
                append_to_el: function () {}
            },

            auth_me: {
                el: d3.select('#auth-me-button'),
                on_click: function () {},
                append_to_el: function () {}
            },

            go_to_profile: {
                el: d3.select('#go-to-profile'),
                on_click: function () {
                    form.state('profile_' + context.user.type());
                },
                append_to_el: function () {}
            },

            profile_link: {
                el: profile_link_selection,
                on_click: function () {
                    form.state('profile_' + context.user.type());
                },
                append_to_el: function () {}
            }
        },
        modal_header: {
            join: {
                el: d3.select('#modal-header-join')
            },
            thanks: {
                el: d3.select('#modal-header-thanks')
            },
            avatar: {
                el: d3.select('#modal-header-avatar')
            }
        },
        display: {
            modal: {
                el: d3.select('#modal')
            },
            call_to_action: {
                el: d3.select('#call-to-action')
            },
            choose_type_add_zip: {
                el: d3.select('#choose-type-add-zip')
            },
            thank_you: {
                el: d3.select('#thank-you')
            },
            profile_individual: {
                el: d3.select('#profile-individual')
            },
            profile_institution: {
                el: d3.select('#profile-institution')
            }
        }
    };

    var states = {
        inactive_no_profile: function () {
            var active = [{
                el_type: 'button',
                el_name: 'open_modal'
            }];
            apply_state(active);
        },
        inactive_with_profile: function () {
            var active = [];
            apply_state(active);
        },
        call_to_action: function () {
            var active = [{
                el_type: 'display',
                el_name: 'modal'
            }, {
                el_type: 'display',
                el_name: 'call_to_action'
            }, {
                el_type: 'modal_header',
                el_name: 'join'
            }, {
                el_type: 'button',
                el_name: 'close_modal'
            }];

            apply_state(active);
        },
        choose_type_add_zip: function () {
            var active = [{
                el_type: 'display',
                el_name: 'modal'
            }, {
                el_type: 'display',
                el_name: 'choose_type_add_zip'
            }, {
                el_type: 'modal_header',
                el_name: 'join'
            }, {
                el_type: 'button',
                el_name: 'close_modal'
            }, {
                el_type: 'button',
                el_name: 'close_modal'
            }];

            apply_state(active);
        },
        thank_you: function () {
            var active = [{
                el_type: 'display',
                el_name: 'modal'
            }, {
                el_type: 'display',
                el_name: 'thank_you'
            }, {
                el_type: 'modal_header',
                el_name: 'thanks'
            }, {
                el_type: 'button',
                el_name: 'close_modal'
            }];

            apply_state(active);
        },
        profile_individual: function () {
            var active = [{
                el_type: 'display',
                el_name: 'modal'
            }, {
                el_type: 'display',
                el_name: 'profile_individual'
            }, {
                el_type: 'modal_header',
                el_name: 'avatar'
            }, {
                el_type: 'button',
                el_name: 'close_modal'
            }];

            apply_state(active);
        },
        profile_institution: function () {
            var active = [{
                el_type: 'display',
                el_name: 'modal'
            }, {
                el_type: 'display',
                el_name: 'profile_institution'
            }, {
                el_type: 'modal_header',
                el_name: 'avatar'
            }, {
                el_type: 'button',
                el_name: 'close_modal'
            }];

            apply_state(active);
        }
    };

    form.init = function () {

        for (var key in el.button) {
            // setup buttons
            el.button[key]
                .el
                .on('click', el.button[key].on_click)
                .call(el.button[key].append_to_el);
        }

        social_auth.render();
        select_type.render();
        select_work_in.render();

        if (context.countries.data()) {
            // if the data is loaded already,
            // populate the select_geo module
            select_geo
                .options(context.countries.data())
                .render();
        } else {
            // wait until it is loaded, and then
            // render based on results
            context.countries.dispatch.on('loaded.modal', function () {
                select_geo
                    .options(context.countries.data())
                    .render();
            });
        }

        // how validation can propogate to this level
        social_auth
            .dispatch
            .on('valid.formElementCheck', function (d, i) {
                if (authIsValid()) {
                    enable_auth_me();
                }
            });

        select_geo
            .dispatch
            .on('validChange.formElementCheck', function () {
                if (zipAndTypeValid()) {
                    enable_add_me();
                } else {
                    disable_add_me();
                }
            });

        select_type
            .dispatch
            .on('valid.formElementCheck', function (d) {
                if (zipAndTypeValid()) {
                    enable_add_me();
                }
            });

        select_work_in
            .dispatch
            .on('valid.formElementCheck', function (d) {
                if (zipAndTypeValid()) {
                    enable_add_me();
                }
            });

        context.user
               .dispatch.on('checkAuthComplete', function(err, d) {
            d = context.user.data();
            console.log('auth check dispatch modal');
            console.log(d);

            if (context.user.authed()) {
                // authenticated

                form.add_avatar(d.objects[0].avatar_url);

                if ((d.objects[0].top_level) &&
                    ((d.objects[0].individual) ||
                     (d.objects[0].institution))) {

                    // should have given all info
                    // to be signed up and dont have
                    // to be sold on it
                    form.state('inactive_with_profile');
                    context.user
                        .profile
                            .build();

                } else {

                    // have authenticated, but no
                    // data associated with them
                    form.state('choose_type_add_zip');
                }


            } else {
                // has not been authenticated
                // assume the user has never been
                // and ask them to sign up
                form.state('call_to_action');
            }
        });

        return form;
    };

    form.add_avatar = function (x) {

        d3.selectAll('.avatar')
            .attr('src', x);

        return form;
    };

    form.state = function (x) {
        if (!arguments.length) return state;

        if (x in states) {
            previous_state = state;
            state = x;
            states[state]();
        }

        return form;
    };

    function add_me_flow () {
        // for the User that is stored.
        context.user
            .type(select_type.selected().label)
            .work_in(select_work_in.selected().label)
            .top_level_input(select_geo.validatedData());

        steamie_request(
            context.user.data(),
            function (err, results_raw) {
                var results = JSON.parse(results_raw.responseText);

                console.log('add me flow');
                console.log(results);
                if (err) {
                    console.log('error');
                    console.log(err);

                    // if there is an error, return
                    // the user to the stage where
                    // they left off, attempting to
                    // be added.
                    form.state('choose_type_add_zip');
                }

                // update the user data based on
                // what came back from the server
                // also builds out an initial profile
                // for the user based on their new
                // data input
                context.user
                    .data(results)
                    .profile
                        .build();

                // show thank you
                form.state('thank_you');
            });
    }

    function steamie_request(data_to_submit, callback) {
        console.log('complete submit');
        // submit data

        var csrf_token = get_cookie('csrftoken');
        console.log(csrf_token);

        console.log('url');
        console.log(context.api.steamie);
        // api.steamie
        // 'http://0.0.0.0:5000/api/v1/steamie/'
        var xhr = d3.xhr(context.api.steamie)
            .mimeType('application/json')
            .header('X-CSRFToken', csrf_token)
            .header('Content-type', 'application/json')
            .send('PUT',
                  JSON.stringify(data_to_submit),
                  callback);
    }

    function show_validation_errors(errors) {
        console.log('show validation errors');
    }

    function get_cookie (c_name) {
        var c_value = document.cookie;
        var c_start = c_value.indexOf(" " + c_name + "=");
        if (c_start == -1) {
            c_start = c_value.indexOf(c_name + "=");
        }
        if (c_start == -1) {
            c_value = null;
        } else {
            c_start = c_value.indexOf("=", c_start) + 1;
            var c_end = c_value.indexOf(";", c_start);
            if (c_end == -1) {
                c_end = c_value.length;
            }
            c_value = unescape(c_value.substring(c_start, c_end));
        }
        return c_value;
    }

    function check_child () {
        if (child_window.closed) {
            // stop checking for the child window status
            clearInterval(child_status);

            // check to see if auth occured
            context.user.check_auth();
        } else {
            // console.log('child open');
        }
    }

    function process_authentication (d) {

        var popup = ui.popup_window_properties(),

            window_features =
                'width=' + popup.width + ',' +
                'height=' + popup.height + ',' +
                'left=' + popup.x + ',' +
                'top=' + popup.y;

        child_window =
            window.open(d.url, '',  window_features);

        child_status = setInterval(check_child, 1000);
    }

    function apply_state (active) {
        // referencing the el obj of this module
        
        for (var type_key in el) {
            for (var name_key in el[type_key]) {
                if (active.length === 0) {
                    // set all hidden
                    el[type_key][name_key]
                        .el
                        .classed('active', false);
                } else {
                    var status_to_set = false;

                    for (var i = 0; i < active.length; i++) {
                        if ((active[i].el_type === type_key) &&
                            (active[i].el_name === name_key)) {

                            status_to_set = true;
                        }
                    }

                    el[type_key][name_key]
                            .el
                            .classed('active', status_to_set);
                }
            }
        }
    }

    // ensure validity of form elements
    function zipAndTypeValid () {
        if (select_geo.isValid() &&
            select_type.isValid() &&
            select_work_in.isValid()) {
            return true;
        }
        return false;
    }

    function authIsValid () {
        if (social_auth.isValid()) {
            return true;
        }
        return false;
    }

    // enable buttons to proceed through
    // the form process
    function enable_auth_me () {
        el.button.auth_me.el
            .classed('enabled', true)
            .on('click', function () {
                process_authentication(social_auth.selected());
            });
    }

    function enable_add_me () {
        el.button.add_me.el
            .classed('enabled', true)
            .on('click', function () {
                add_me_flow();
            });
    }

    function disable_add_me () {
        el.button.add_me.el
            .classed('enabled', false)
            .on('click', null);
    }

    return form;
}