define(["backbone", "underscore", "hbs!app/templates/topic"],
    function(Backbone, _, topicTemplate) {

        var TopicView = Backbone.View.extend({
            template: topicTemplate,

            serialize: function() {
                //serialize trail, topic and items
                var out = {};
                out.trail = window.session.currentTrail.toJSON();
                out.topic = this.topic.toJSON();
                //out.items = this.items.toJSON();
                out.audio_items = new Backbone.Collection(this.items.where({type: 'audio'})).toJSON();
                out.interact_items = new Backbone.Collection(this.items.filter(function(item){ return item.attributes.type !== 'audio'; })).toJSON();
                return out;
            },

            initialize: function(params) {
                //this.trail = params.trail;
                this.topic = params.topic;
                this.items = this.topic.items;

                //listen for the relevant beacon
                var eventName = 'beaconRange:' + this.topic.attributes.beaconID;
                this.listenTo(Backbone, eventName, this.didRangeBeacon);
                this.isNearItem = false;
            },

	        afterRender: function() {

	        },

            events: {
                "click .show-map-button": "showMap",
                "click .close-map-overlay": "hideMap",
                "click .header": "showImage",
                "click .close-image-overlay": "hideImage"
            },

            showMap: function(ev) {
                ev.preventDefault();
                $('.object-map').show();
            },
            hideMap: function(ev) {
                ev.preventDefault();
                $('.object-map').hide();
            },

            showImage: function(ev) {
                ev.preventDefault();
                $('.object-full-image').show();
            },
            hideImage: function(ev) {
                ev.preventDefault();
                $('.object-full-image').hide();
            },

            didRangeBeacon: function(data) {
                if(data.proximity === 'ProximityImmediate' || data.proximity == 'ProximityNear')
                {
                    ////vibrate if this is a transition to near
                    if(navigator.notification && !this.isNearItem) {
                        navigator.notification.vibrate(500);
                        //add class to item to make bg cycle
                        $('.object-container').addClass('nearby');
                        this.isNearItem = true;
                    }

                }
                else {
                    //remove class which makes bg cycle
                    $('.object-container').removeClass('nearby');
                    this.isNearItem = false;
                }
            }

        });

        return TopicView;

    });