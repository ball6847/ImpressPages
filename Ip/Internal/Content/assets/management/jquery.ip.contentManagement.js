/**
 * @package ImpressPages
 *
 *
 */


(function($) {
    "use strict";
    var lastDroppable = false;


    var methods = {
        init : function(options) {


            return this.each(function() {

                var $this = $(this);

                var data = $this.data('ipContentManagement');

                // If the plugin hasn't been initialized yet
                if ( ! data ) {
                    $this.data('ipContentManagement', {
                    });

                    $(window).resize(function () {
                        if (this.resizeTO) {
                            clearTimeout(this.resizeTO);
                        }
                        this.resizeTO = setTimeout(function () {
                            $(this).trigger('resizeEnd');
                        }, 100);
                    });
                    $(window).bind('resizeEnd', ipAdminWidgetsScroll);


                    // case insensitive search
                    ip.jQuery.expr[':'].icontains = function (a, i, m) {
                        return ip.jQuery(a).text().toUpperCase().indexOf(m[3].toUpperCase()) >= 0;
                    };

                    if (isMobile) {
                        $('body').addClass('ipMobile');
                    }


                    $('body').prepend(ipContentInit.saveProgressHtml);
                    $('body').prepend(ipContentInit.controlPanelHtml);

                    var options = new Object;
                    options.zoneName = ip.zoneName;
                    options.pageId = ip.pageId;
                    options.revisionId = ip.revisionId;
                    options.widgetControlsHtml = ipContentInit.widgetControlsHtml;
                    options.contentManagementObject = $this;
                    options.manageableRevision = ipContentInit.manageableRevision;

                    var data = $this.data('ipContentManagement');
                    data.initInfo = options;
                    $this.data('ipContentManagement', data);

                    $('.ipAdminPanel .ipActionWidgetButton').ipAdminWidgetButton();



                    ipAdminPanelInit();
                    ipAdminWidgetsScroll();
                    ipAdminWidgetsSearch();

                    $('.ipAdminPanel .ipActionWidgetButton').on('dragstart', ipStartWidgetDrag);
                    $('.ipAdminPanel .ipActionWidgetButton').on('dragstop', ipStopWidgetDrag);

                    //$('.ipWidget').on('sortstart', ipStartWidgetDrag);
                    $('.ipBlock .ipWidget').on('dragstart.ipContentManagement', ipStartWidgetDrag);
                    $('.ipBlock .ipWidget').on('dragstop.ipContentManagement', ipStopWidgetDrag);
                    $('body').on('reinitRequired.ipWidget', function () {
                        $('.ipBlock .ipWidget').off('dragstart.ipContentManagement').on('dragstart.ipContentManagement', ipStartWidgetDrag);
                        $('.ipBlock .ipWidget').off('dragstop.ipContentManagement').on('dragstop.ipContentManagement', ipStopWidgetDrag);
                    })

                    $('.ipAdminPanel .ipActionSave').on('click', function(e){$.proxy(methods.save, $this)(false)});
                    $('.ipAdminPanel .ipActionPublish').on('click', function(e){$.proxy(methods.save, $this)(true)});
                    $('.ipAdminPanelContainer .ipsPreview').on('click', function(e){e.preventDefault(); ipManagementMode.setManagementMode(0);});
                    $this.on('error.ipContentManagement', function (event, error){$(this).ipContentManagement('addError', error);});
                    $.proxy(methods.initBlocks, $this)($('.ipBlock'));

                    $this.trigger('initFinished.ipContentManagement', options);

                }
            });
        },



        initBlocks : function(blocks) {
            var $this = this;
            var data = $this.data('ipContentManagement');
            var options = data.initInfo;
            if (options.manageableRevision) {
                blocks.ipBlock(options);
            }
        },

        addError : function (errorMessage) {
            var $newError = $('.ipAdminErrorSample .ipAdminError').clone();
            $newError.text(errorMessage);
            $('.ipAdminErrorContainer').append($newError);
            $newError.animate( {opacity: "100%"}, 6000)
            .animate( { queue: true, opacity: "0%" }, { duration: 3000, complete: function(){$(this).remove();}});
        },


        save : function(publish) {
            return this.each(function() {
                var $this = $(this);
                var data = $this.data('ipContentManagement');

                var postData = Object();
                postData.aa = 'Content.savePage';
                postData.securityToken = ip.securityToken;
                postData.revisionId = ip.revisionId;
                if (publish) {
                    postData.publish = 1;
                } else {
                    postData.publish = 0;
                }

                $.ajax({
                    type : 'POST',
                    url : ip.baseUrl,
                    data : postData,
                    context : $this,
                    success : methods._savePageResponse,
                    dataType : 'json'
                });
            });
        },

        _savePageResponse: function(response) {
            var $this = $(this);
            var data = $this.data('ipContentManagement');
            if (response.status == 'success') {
                window.location.href = response.newRevisionUrl;
            } else {

            }
        }


    };


    /**
     *
     * Function used to paginate Widgets on Administration Panel
     *
     * @param none
     * @returns nothing
     *
     *
     */
    var ipAdminWidgetsScroll = function () {
        var $scrollable = $('.ipAdminWidgetsContainer'); // binding object
        $scrollable.scrollable({
            items: 'li', // items are <li> elements; on scroll styles will be added to <ul>
            touch: false
        });
        var scrollableAPI = $scrollable.data('scrollable'); // getting instance API
        var itemWidth = scrollableAPI.getItems().eq(0).outerWidth(true);
        var containerWidth = scrollableAPI.getRoot().width() + 24; // adding left side compensation
        var scrollBy = Math.floor(containerWidth / itemWidth); // define number of items to scroll
        if (scrollBy < 1) {
            scrollBy = 1;
        } // setting the minimum
        $('.ipAdminWidgets .ipsRight, .ipAdminWidgets .ipsLeft').off('click'); // unbind if reinitiating dynamically
        scrollableAPI.begin(); // move to scroller to default position (beginning)
        $('.ipAdminWidgets .ipsRight').on('click', function (event) {
            event.preventDefault();
            scrollableAPI.move(scrollBy);
        });
        $('.ipAdminWidgets .ipsLeft').on('click', function (event) {
            event.preventDefault();
            scrollableAPI.move(-scrollBy);
        });
    }

    /**
     *
     * Function used to search Widgets on Administration Panel
     *
     * @param none
     * @returns nothing
     *
     *
     */
    var ipAdminWidgetsSearch = function () {
        var $input = $('.ipAdminWidgetsSearch .ipsInput');
        var $button = $('.ipAdminWidgetsSearch .ipsButton');
        var $widgets = $('.ipAdminWidgetsContainer li');

        $input.focus(function () {
            if (this.value == this.defaultValue) {
                this.value = '';
            }
            ;
        }).blur(function () {
                if (this.value == '') {
                    this.value = this.defaultValue;
                }
                ;
            }).keyup(function () {
                var value = this.value;
                $widgets.css('display', ''); // restate visibility
                if (value && value != this.defaultValue) {
                    $widgets.not(':icontains(' + value + ')').css('display', 'none');
                    $button.addClass('ipaClear');
                } else {
                    $button.removeClass('ipaClear');
                }
                ipAdminWidgetsScroll(); // reinitiate scrollable
            });

        $button.click(function (event) {
            event.preventDefault();
            var $this = $(this);
            if ($this.hasClass('ipaClear')) {
                $input.val('').blur().keyup(); // blur returns default value; keyup displays all hidden widgets
                $this.removeClass('ipaClear'); // makes button look default
            }
        });
    }

    /**
     *
     * Function used to create a space on a page for Administration Panel
     *
     * @param none
     * @returns nothing
     *
     *
     */
    var ipAdminPanelInit = function () {
        var $container = $('.ipAdminPanelContainer'); // the most top element physically creates a space
        var $panel = $('.ipAdminPanel'); // Administration Panel that stays always visible
        $container.height($panel.height()); // setting the height to container
        $panel.css('top', $('.ipsAdminNavbarContainer').outerHeight()); // move down to leave space for top navbar
    }

    var ipStartWidgetDrag = function (event, ui) {
        var draggingElement = ui.item;

        //drop side
        var sidePlaceholders = new Array();

        $('.ipBlock > .ipWidget').not(".ipWidget .ipWidget").not(draggingElement).each(function (key, value) {
            //left placeholder
            sidePlaceholders.push({
                left: $(value).offset().left - 20,
                top: $(value).offset().top + 1,
                height: Math.max($(value).height() - 2, 10),
                width: 20,
                instanceId: $(value).data('widgetinstanceid'),
                leftOrRight: 'left'
            });

            //right placeholder
            sidePlaceholders.push({
                left: $(value).offset().left + $(value).width(),
                top: $(value).offset().top + 1,
                height: Math.max($(value).height() - 2, 10),
                width: 20,
                instanceId: $(value).data('widgetinstanceid'),
                leftOrRight: 'right'
            });
        });

        $.each(sidePlaceholders, function (key, value) {
            var $droppable = $('<div class="ipsWidgetDropPlaceholder ipAdminWidgetPlaceholderVertical"><div class="ipsWidgetDropMarker _marker"></div></div>');
            $('body').append($droppable);
            $droppable.css('position', 'absolute');
            $droppable.css('left', value.left + 'px');
            $droppable.css('top', value.top + 'px');
            $droppable.css('height', value.height + 'px');
            $droppable.css('width', value.width + 'px');
            $droppable.data('instanceId', value.instanceId);
            $droppable.data('leftOrRight', value.leftOrRight);
            $droppable.data('side', 1);
            $droppable.find('.ipsWidgetDropMarker').height(value.height);
            $droppable.find('.ipsWidgetDropMarker').css('marginLeft', Math.round(value.width / 2));
        });

        //------------------------------------------------------

        var colsPlaceholders = new Array();
        $.each($('.ipWidget-Columns'), function (widgetKey, columnsWidget) {
            $.each($(columnsWidget).find('.ipsCol'), function (colKey, col) {
                var $col = $(col);
                var $prevBlock = $col.prev().find('.ipBlock');
                var $block = $col.find('.ipBlock');
                if (colKey != 0 && $block.offset() && $prevBlock.offset()) { //skip first col. Offset checking is just in case. If everything goes right, prev block should always exist.
                    var space = $block.offset().left - ($prevBlock.offset().left + $prevBlock.width());
                    //alert(space);
                    colsPlaceholders.push({
                        left: $col.find('.ipBlock').offset().left - space,
                        top: $col.find('.ipBlock').offset().top + 1,
                        height: Math.max($(columnsWidget).height() - 2, 10),
                        width: space,
                        instanceId: $(columnsWidget).data('widgetinstanceid'),
                        position: colKey
                    });
                }
            });
        });


        $.each(colsPlaceholders, function (key, value) {
            var $droppable = $('<div class="ipsWidgetDropPlaceholder ipAdminWidgetPlaceholderVertical"><div class="ipsWidgetDropMarker _marker"></div></div>');
            $('body').append($droppable);
            $droppable.css('position', 'absolute');
            $droppable.css('left', value.left + 'px');
            $droppable.css('top', value.top + 'px');
            $droppable.css('height', value.height + 'px');
            $droppable.css('width', value.width + 'px');
            $droppable.data('instanceId', value.instanceId);
            $droppable.data('newCol', 1);
            $droppable.data('position', value.position);
            $droppable.find('.ipsWidgetDropMarker').height(value.height);
            $droppable.find('.ipsWidgetDropMarker').css('marginLeft', Math.round(value.width / 2));
        });

        //------------------------------------------------------

        //drop between the widgets horizontally
        var horizontalPlaceholders = new Array();
        $.each($('.ipBlock'), function (blockKey, block) {
            var $widgets = $(block).find('> .ipWidget');
            $.each($widgets, function (key, value) {
                var $widget = $(value);
                var newPlaceholder = {};
                if ($widget.index() == 0) { //first widget
                    var space = 15;
                    //first placeholder
                    newPlaceholder = {
                        left: $widget.offset().left,
                        top: $widget.offset().top - space,
                        width: $widget.width(),
                        blockName: $(block).data('ipBlock').name,
                        position: 0,
                        markerOffset: space/2
                    };

                    newPlaceholder.height = $widget.offset().top + ($widget.height() / 2) - newPlaceholder.top;
                    if ($widget.hasClass("ipWidget-Columns")) { //if this is a columns widget, make a 3/4 space for droping. Leave 1/4 for column placeholders
                        newPlaceholder.height = space*3/4;
                        newPlaceholder.markerOffset = space*3/4 / 2;
                    }

                    if ($widget.closest('.ipWidget-Columns').length && !$widget.hasClass("ipWidget-Columns")) {//if this is first widget inside a column. Take 1/4 of space for placeholder
                        var $aboveColumnsWidget = $widget.closest('.ipWidget-Columns').prev();
                        if ($aboveColumnsWidget.length) {
                            space = $widget.offset().top - ($aboveColumnsWidget.offset().top + $aboveColumnsWidget.height());
                            newPlaceholder.top = $widget.offset().top - space / 2;
                            newPlaceholder.markerOffset = space / 2 / 2; //half of marker size
                        } else {
                            newPlaceholder.top = $widget.offset().top - space * 1 / 4;
                            newPlaceholder.markerOffset = space * 1 / 4 / 2;

                        }

                        if ($widget.hasClass('ipWidget-Text') && $widget.find('.ipsContent > *').length) {
                            //middle of the first paragraph
                            var $firstParagraph = $widget.find('.ipsContent > *').first();
                            newPlaceholder.height = $firstParagraph.offset().top + Math.round($firstParagraph.height() / 2) - newPlaceholder.top;
                        } else {
                            //middle of the widget
                            newPlaceholder.height = $widget.offset().top + ($widget.height() / 2) - newPlaceholder.top;
                        }

                    }


                    horizontalPlaceholders.push(newPlaceholder);
                } else {  //not first widget
                    var $prevWidget = $widget.prev();
                    var space = $widget.offset().top - ($prevWidget.offset().top + $prevWidget.height());
                    //all up to the last placeholders
                    newPlaceholder = {
                        left: $prevWidget.offset().left,
                        top: $prevWidget.offset().top + ($prevWidget.height() / 2),
                        width: $widget.width(),
                        blockName: $(block).data('ipBlock').name,
                        position: $widget.index()
                    };
                    if ($prevWidget.hasClass("ipWidget-Columns")) { //if above is columns widget
                        newPlaceholder.top = $prevWidget.offset().top + $prevWidget.height() + space * 1 / 4; //the end of column widget
                    }

                    if ($prevWidget.hasClass('ipWidget-Text') && $prevWidget.find('.ipsContent > *').length) {
                        //start placeholder from the middle of last paragraph
                        var $lastParagraph = $prevWidget.find('.ipsContent > *').last();
                        newPlaceholder.top = $lastParagraph.offset().top + Math.round($lastParagraph.height() / 2)
                    }


                    if ($widget.hasClass('ipWidget-Text') && $widget.find('.ipsContent > *').length) {
                        //placeholder touches center of first paragraph
                        var $firstParagraph = $widget.find('.ipsContent > *').first();
                        newPlaceholder.height = $firstParagraph.offset().top - newPlaceholder.top + Math.round($firstParagraph.height() / 2);
                    } else {
                        //placeholder touches the center of the widget
                        newPlaceholder.height = $widget.offset().top + ($widget.height() / 2) - newPlaceholder.top;
                    }

                    if ($widget.hasClass('ipWidget-Columns')) {
                        newPlaceholder.height = $widget.offset().top - newPlaceholder.top - (space / 2);
                        newPlaceholder.markerOffset = newPlaceholder.height - 1 ;
                    }




                    newPlaceholder.markerOffset = ($prevWidget.offset().top + $prevWidget.height() + $widget.offset().top) / 2 - newPlaceholder.top;

                    horizontalPlaceholders.push(newPlaceholder);
                }

                if ($widget.index() == $widgets.length - 1) {
                    var space = 10;
                    var lastPlaceholder = {
                        left: $widget.offset().left,
                        top: newPlaceholder.top + newPlaceholder.height + 1,
                        height: $widget.height() / 2 + space,
                        width: $widget.width(),
                        markerOffset: $widget.height() / 2 + space / 2,
                        blockName: $(block).data('ipBlock').name,
                        position: $widget.index() + 1
                    };

                    var $columnsWidget = $widget.closest('.ipWidget-Columns');
                    if ($columnsWidget.length && !$widget.hasClass("ipWidget-Columns")) {
                        var columnsEnd = $columnsWidget.offset().top + $columnsWidget.height();
                        if ($columnsWidget.next().length) {
                            space = $columnsWidget.next().offset().top - columnsEnd;
                        }
                        lastPlaceholder.height = columnsEnd -  lastPlaceholder.top + space * 1 / 4;
                    }

                    if ($widget.hasClass('ipWidget-Columns')) {
                        var columnsEnd = $columnsWidget.offset().top + $columnsWidget.height();
                        lastPlaceholder.height = space * 2;
                        lastPlaceholder.top = columnsEnd + space * 1 / 4;
                        lastPlaceholder.markerOffset = 5;
                    }

                    horizontalPlaceholders.push(lastPlaceholder);
                }

            });


            if ($(block).find('> .ipWidget').length == 0) { //empty block
                var $block = $(block);
                horizontalPlaceholders.push({
                    left: $block.offset().left,
                    top: $block.offset().top,
                    height: $block.height(),
                    width: $block.width(),
                    markerOffset: $block.height() / 2,
                    blockName: $block.data('ipBlock').name,
                    position: 0
                });


            }
        });


        $.each(horizontalPlaceholders, function (key, value) {
            var $droppable = $('<div class="ipsWidgetDropPlaceholder ipAdminWidgetPlaceholderHorizontal"><div class="ipsWidgetDropMarker _marker"></div></div>');
            $('body').append($droppable);
            $droppable.css('position', 'absolute');
            $droppable.css('left', value.left + 'px');
            $droppable.css('top', value.top + 'px');
            $droppable.css('width', value.width + 'px');
            $droppable.css('height', value.height + 'px');
            $droppable.find('.ipsWidgetDropMarker').css('marginTop', value.markerOffset);
            $droppable.data('position', value.position);
            $droppable.data('blockName', value.blockName);
        });


//        //drop between paragraphs inside widget
//        var paragraphPlaceholders = new Array();
//        $.each($('.ipWidget-Text'), function (widgetKey, widget) {
//            var $widget = $(widget);
//            var $paragraphs = $(widget).find('.ipsContent > *');
//            if($paragraphs.length <= 1) {
//                return;
//            }
//            $.each($paragraphs, function (paragraphKey, paragraph) {
//                var $paragraph = $(paragraph);
//
//                if (paragraphKey == 0) {
//                    return;
//                }
//                var $prevParagraph = $paragraphs.eq(paragraphKey - 1);
//
//                var newPlaceholder = {
//                    left: $widget.offset().left,
//                    top: $prevParagraph.offset().top + Math.round($prevParagraph.height() / 2),
//                    width: $widget.width(),
//                    widgetinstanceid: $paragraph.data('instanceId'),
//                    position: paragraphKey + 1
//                };
//
//                newPlaceholder.height = $paragraph.offset().top + Math.round($paragraph.height() / 2) - newPlaceholder.top;
//                newPlaceholder.markerOffset = ($prevParagraph.offset().top + $prevParagraph.height() + $paragraph.offset().top) / 2 - newPlaceholder.top;
//
//                paragraphPlaceholders.push(newPlaceholder);
//
//            });
//        });



        $.each(paragraphPlaceholders, function (key, value) {
            var $droppable = $('<div class="ipsWidgetDropPlaceholder ipAdminWidgetPlaceholderHorizontal"><div class="ipsWidgetDropMarker _marker"></div></div>');
            $('body').append($droppable);
            $droppable.css('position', 'absolute');
            $droppable.css('left', value.left + 'px');
            $droppable.css('top', value.top + 'px');
            $droppable.css('width', value.width + 'px');
            $droppable.css('height', value.height + 'px');
            $droppable.find('.ipsWidgetDropMarker').css('marginTop', value.markerOffset);
            $droppable.data('position', value.position);
            $droppable.data('widgetinstanceid', value.widgetInstanceId);
            $droppable.data('paragraph', 1);
        });

        $('.ipsWidgetDropPlaceholder').droppable({
            accept: ".ipActionWidgetButton, .ipWidget",
            activeClass: "",
            hoverClass: "hover",
            greedy: true,
            over: function (event, ui) {
                lastDroppable = $(this);
                $(this).data('hover', true);
            },
            out: function (event, ui) {
                $(this).data('hover', false);
            },
            drop: function (event, ui) {
                //this method on jQuery-ui is buggy and fires fake drop events. So we better handle stop event on draggable. This is just for widget side drops.
            }
        });

    }


    var ipStopWidgetDrag = function (event, ui) {
        if (lastDroppable && lastDroppable.data('hover') && $(event.target).data('ipAdminWidgetButton')) {
            //new widget has been dropped
            var targetWidgetInstanceId = lastDroppable.data('instanceId');
            var leftOrRight = lastDroppable.data('leftOrRight');
            var widgetName = $(this).data('ipAdminWidgetButton').name;
            var side = lastDroppable.data('side');
            var newCol = lastDroppable.data('newCol');
            var blockName = lastDroppable.data('blockName');
            var position = lastDroppable.data('position');
            if (side) {
                ipContent.createWidgetToSide(widgetName, targetWidgetInstanceId, leftOrRight);
            } else if (newCol) {
                ipContent.createWidgetToColumn(widgetName, targetWidgetInstanceId, position);
            } else if (paragraph) {
                ipContent.createWidgetToWidget(widgetName, targetWidgetInstanceId, position);
            } else {
                ipContent.createWidget(ip.revisionId, blockName, widgetName, position);
            }
        }
        if (lastDroppable && lastDroppable.data('hover') && $(event.target).hasClass('ipWidget')) {
            //existing widget has been moved
            var $widget = $(event.target);
            var instanceId = $widget.data('widgetinstanceid');
            var curPosition = $widget.index();
            var curBlock = $widget.closest('.ipBlock').data('ipBlock').name;
            var position = lastDroppable.data('position');
            var block = lastDroppable.data('blockName');
            var side = lastDroppable.data('side');
            var newCol = lastDroppable.data('newCol');
            var leftOrRight = lastDroppable.data('leftOrRight');
            var targetWidgetInstanceId = lastDroppable.data('instanceId');
            var sourceWidgetInstanceId = $widget.data('widgetinstanceid');

            if (block == curBlock && curPosition < position) {
                position--;
            }
            if (block != curBlock || curPosition != position) {
                if (side) {
                    ipContent.moveWidgetToSide(sourceWidgetInstanceId, targetWidgetInstanceId, leftOrRight);
                } else if (newCol) {
                    ipContent.moveWidgetToColumn(sourceWidgetInstanceId, targetWidgetInstanceId, position);
                } else if (paragraph) {
                    ipContent.moveWidgetToWidget(sourceWidgetInstanceId, targetWidgetInstanceId, position);
                } else {
                    ipContent.moveWidget(instanceId, position, block, ip.revisionId);
                }
            }

        }

        $('.ipsWidgetDropPlaceholder').remove();


    }






    $.fn.ipContentManagement = function(method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.ipAdminWidgetButton');
        }


    };



})(ip.jQuery);
