/**
 * Created by ahaith on 22/10/2015.
 */
define([
        "backbone",
        "app/views/interactive/clock/RotateHandleView",
        "app/views/interactive/clock/DigitalClockView",
        "app/views/interactive/InteractiveSphereView",
        "moment",
        "hbs!app/templates/interactive/clock",
        "move",
    ], function(
        Backbone,
        RotateHandleView,
        DigitalClockView,
        InteractiveSphereView,
        moment,
        clockTemplate,
        move
    ) {

    TIME = moment();

    var ClockView = Backbone.View.extend({
        template: clockTemplate,

        initialize: function(params) {
            var time = moment().hours(0).minutes(0).seconds(0);
            this.model = new Backbone.Model({
                time: time,

                setTime: function() {
                    this.set({time:TIME});
                },
                //time to angle
                get24HrAngle_H: function() {
                    var totalHours = this.time.hours() + this.time.minutes()/60;
                    var totalRevolutions = totalHours/12;
                    return 360 * totalRevolutions;
                },
                get24HrAngle_M: function() {
                    var revs = ( this.time.minutes() / 60);
                    revs += this.time.hours();
                    return 360 * revs;
                },
                get10HrAngle: function() {
                    //one full revolution per day
                    var hours = this.time.hours() + this.time.minutes()/60;
                    var days = hours/24;
                    return days*360;
                },
                getGlobeAngle: function() {
                    var hours = this.time.hours() + this.time.minutes()/60;
                    var days = hours/24;
                    return days*360 + 180;
                },

                //angle to time
                from24HrAngle_H: function(angle) {
                    this.time.hours(0);
                    var hours = 12*angle/360;
                    this.time.hours( hours );
                    var minutes = 60* (hours%1);
                    this.time.minutes(minutes);
                    return this.time;
                },
                from24HrAngle_M: function(angle) {
                    this.time.hours(0);
                    return this.time.minutes( 60*angle/360 );
                },
                from10HrAngle: function(angle) {
                    var minutes = (angle/360)*24*60;
                    this.time.hours(0);
                    return this.time.minutes(minutes);
                },
                fromGlobeAngle: function(angle) {
                    var minutes = ((angle - 180)/360)*24*60;
                    this.time.hours(0);
                    return this.time.minutes(minutes);
                }

            });

            $('.set-time').click(_.bind(function(ev) {
                this.model.setTime();
            }, this))
        },

        afterRender: function() {

            this.initHands();

            ///digital clock
            this.digitalClockView = new DigitalClockView({
                model: this.model,
                el: $('#digital-clock'),
            });
            this.digitalClockView.render();

            //sphere
            this.sphereModel = new Backbone.Model({
            });
            this.listenTo(this.sphereModel, 'force-change', _.bind(function(source) {
                //same angle as the 10 hour clock - i.e. 1 revolution per day
                var time = this.model.attributes.fromGlobeAngle(this.sphereModel.attributes.angle + 180);
                this.model.set({time: time});
                this.model.trigger('change', this.sphereModel);
            }, this));
            this.sphereView = new InteractiveSphereView({
                el: $('#globe'),
                model: this.sphereModel,
                texture: 'img/objects/globe/map_texture_9.jpg',
                canRotateUpDown: false,
                lightFromSun: true,
                tiltTowardCan: 0,
                marker: {lat: 51.7519, lng:1.2578},
                defaultRotY: 180,
                panRatio: 1.0,
            });
            this.sphereView.render();

        },

        initHands: function() {

            //model for minute hand
            this.twentyFourHourMinuteHandModel = new Backbone.Model({
                handleMinHeight: 120,
                handleWidth: 10,
            });
            //update time when this changes
            this.listenTo(this.twentyFourHourMinuteHandModel, 'force-change', _.bind(function(source) {
                var time = this.model.attributes.from24HrAngle_M(this.twentyFourHourMinuteHandModel.attributes.angle);
                this.model.set({time: time});
                this.model.trigger('change', this.twentyFourHourMinuteHandModel);
                //this.update10hrHand();
                //this.updateHourHand();
            }, this));
            //create view;
            this.twentyFourHourClockMinuteHandView = new RotateHandleView({
                el: $('#twenty-four_min'),
                model: this.twentyFourHourMinuteHandModel,
                image: "img/minute_hand.png"
            });
            this.twentyFourHourClockMinuteHandView.render();


            //model for hour hand
            this.twentyFourHourHourHandModel = new Backbone.Model({
                handleMinHeight: 70,
                handleWidth: 10,
            });
            //update time when this changes
            this.listenTo(this.twentyFourHourHourHandModel, 'force-change', _.bind(function(source) {
                var time = this.model.attributes.from24HrAngle_H(this.twentyFourHourHourHandModel.attributes.angle);
                this.model.set({time: time});
                this.model.trigger('change', this.twentyFourHourHourHandModel);
                //update the other clocks
                //this.update10hrHand();
                //this.updateMinuteHand();
            }, this));
            //create view
            this.twentyFourHourClockHourHandView = new RotateHandleView({
                el: $('#twenty-four_hour'),
                model: this.twentyFourHourHourHandModel,
                image: "img/hour_hand.png",
            });
            this.twentyFourHourClockHourHandView.render();

            //model for ten hour clock hand
            this.tenHourClockModel = new Backbone.Model({
                handleMinHeight: 90,
                handleWidth: 10,
            });
            //update time when this changes
            this.listenTo(this.tenHourClockModel, 'force-change', _.bind(function() {
                var time = this.model.attributes.from10HrAngle(this.tenHourClockModel.attributes.angle - Math.PI/180);
                this.model.set({time: time});
                this.model.trigger('change', this.tenHourClockModel);
                //update other clocks
                //this.updateHourHand();
                //this.updateMinuteHand();

            }, this));
            //create view
            this.tenHourClockView = new RotateHandleView({
                el: $('#ten-hr'),
                model: this.tenHourClockModel,
                image: "img/hour_hand.png",
            });
            this.tenHourClockView.render();

            //listen for touch events and propagate to each clock hand in turn
            this.$el.on('touchstart', _.bind(function(ev) {
                if(this.tenHourClockView.handleTouchStart(ev)) {
                    if(this.twentyFourHourClockHourHandView.handleTouchStart(ev)) {
                        if(this.twentyFourHourClockMinuteHandView.handleTouchStart(ev))
                        {
                            //unhandled touch event
                        }
                    }
                }
            },this));

            this.$el.on('touchmove', _.bind(function(ev) {
                if(this.tenHourClockView.handleTouchMove(ev)) {
                    if(this.twentyFourHourClockHourHandView.handleTouchMove(ev)) {
                        if(this.twentyFourHourClockMinuteHandView.handleTouchMove(ev))
                        {
                            //unhandled event
                        }
                    }
                }
            }, this));

            this.listenTo(this.model, 'change', _.bind(function(source) {
                if(source !== this.twentyFourHourHourHandModel) {
                    this.updateHourHand();
                }
                if(source !== this.twentyFourHourMinuteHandModel) {
                    this.updateMinuteHand();
                }
                if(source !== this.tenHourClockModel) {
                    this.update10hrHand();
                }
                if(source !== this.sphereModel) {
                    this.updateSphere();
                }
                this.digitalClockView.updateTime();
            }, this));
        },

        updateMinuteHand: function() {
            var angle24hr_minutehand = this.model.attributes.get24HrAngle_M();
            this.twentyFourHourMinuteHandModel.set({angle: angle24hr_minutehand});
        },

        updateHourHand: function() {
            var angle24hr_hourhand = this.model.attributes.get24HrAngle_H();
            this.twentyFourHourHourHandModel.set({angle: angle24hr_hourhand });
        },

        update10hrHand: function() {
            var angle = this.model.attributes.get10HrAngle();
            this.tenHourClockModel.set({angle: angle});
        },

        updateSphere: function() {
            var angle = this.model.attributes.getGlobeAngle();
            this.sphereModel.set({angle: angle});
            //stop spinning
            this.sphereView.lastDeltaX = 0;
        }


    });
    return ClockView;

});