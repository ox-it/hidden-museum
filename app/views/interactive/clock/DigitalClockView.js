/**
 * Created by ahaith on 26/10/2015.
 */
define([
        'backbone',
        'hbs!app/templates/interactive/digitalClock'
            ], function(
        Backbone,
        digitalClockTemplate
    ) {

   var DigitalClockView = Backbone.View.extend( {
       template: digitalClockTemplate,

       initialize: function() {
           //this.listenTo(this.model, 'change', this.render);

           //listen for touch start/end events anywhere.
           this.numTouches = 0;
           this.decreaseInterval = null;
           this.increaseInterval = null;
           this.updateTime = _.bind(this._updateTime, this);
       },

       afterRender: function() {
           if(!this.listenersInitialised) {
               $('#digital-clock').on('touchstart', _.bind(this.onTouchStart, this));
               $('#digital-clock').on('touchend', _.bind(this.onTouchEnd, this));
               $('#digital-clock').on('touchcancel', _.bind(this.onTouchEnd, this));
               this.listenersInitialised = true;
           }
       },

       //tell layout manager not to use RequestAnimationFrame to manage rendering.
       // the sphere uses that, which causes an issue here.
       useRAF : false,

       serialize: function() {


           var out = {
               time: this.model.attributes.time.format("HH:mm"),
           };
           return out;
       },



       _updateTime: function() {
           $('.digital-time').html(this.model.attributes.time.format("HH:mm"));
       },

       events: {
           "click .increase-time": "increaseTime",
           "click .decrease-time": "decreaseTime"
       },

       increaseTime: function() {
           this.model.attributes.time.add(1, 'minute');
           this.model.trigger('change', this);
       },

       decreaseTime: function() {
           this.model.attributes.time.subtract(1, 'minute');
           this.model.trigger('change', this);
       },

       onTouchStart: function(ev) {
            var target = ev.originalEvent.changedTouches[0].target;
            //check if we are on the increase button
            if( target == $('.increase-time')[0])
            {
                if(this.increaseInterval == null) {
                    this.increaseInterval = setInterval(_.bind(this.increaseTime, this), 10);
                }
                clearInterval(this.decreaseInterval);
                this.decreaseInterval = null;
            }
            else if(target == $('.decrease-time')[0])
            {
                if(this.decreaseInterval == null) {
                    this.decreaseInterval = setInterval(_.bind(this.decreaseTime, this), 10);
                }
                clearInterval(this.increaseInterval);
                this.increaseInterval = null;
            }
           //check if we are on the decrease button
           this.numTouches++;
       },

       onTouchEnd: function(ev) {
           this.increasing = this.decreasing = false;
           this.numTouches--;

           clearInterval(this.increaseInterval);
           this.increaseInterval = null;
           clearInterval(this.decreaseInterval);
           this.decreaseInterval = null;
       },

       cleanup: function() {
           $('#digital-clock').off('touchstart');
           $('#digital-clock').off('touchend');
       }
   });

    return DigitalClockView;
});