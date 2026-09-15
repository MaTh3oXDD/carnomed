$(function() {

    let active_filters_count = $('.js-active-filters-count').val();
    if(active_filters_count) {
        $('.js-get-active-filters-count').text(active_filters_count).removeClass('u-hide');
    }

    // FILTER BOX

    $(document).on('click', '.js-expand-filter', function() {
        let handle = $(this);
        let filter_box = handle.parents('.c-filter-box');
        let wrapper = filter_box.find('.c-filter-box__wrapper');
        let max_height = wrapper.attr('data-max-height');

        if(max_height <= 0 || !max_height) {
            let height = wrapper.height();
            wrapper.css('max-height', height).attr('data-max-height', height);
        }

        let alt_text = handle.attr('data-alt-text');
        let text = handle.text();
        handle.text(alt_text).attr('data-alt-text', text);

        if(filter_box.find('.c-filter-box__wrapper').hasClass('is-active')) {
            setTimeout(function() {
                animateHeight(filter_box.find('.c-filter-box__wrapper'), max_height, '0.4');
                handle.text(alt_text).attr('data-alt-text', text);
            }, 50);
            setTimeout(function() {
                filter_box.find('.c-filter-box__wrapper').removeClass('is-active');
                filter_box.find('.c-filter-box__count-more').show();
            }, 450)
        } else {
            filter_box.find('.c-filter-box__wrapper').addClass('is-active');
            setTimeout(function() {
                animateHeight(filter_box.find('.c-filter-box__wrapper'), 'full', '0.4');
                filter_box.find('.c-filter-box__count-more').hide();
            }, 50);
        }
    })

    // PRICE FILTER
    $(document).on('submit', '.js-price-filter-form', function () {
        let location;
        let word = $('.js-search-query').val() || '';
        let url = $(this).attr('data-filters-url');
        let price_min = Math.round(parseFloat($(this).find('.js-price-filter-min-input').val()) * 100);
        let price_max = Math.round(parseFloat($(this).find('.js-price-filter-max-input').val()) * 100);

        if (url.indexOf('p_min') !== -1 || url.indexOf('p_max') !== -1) {
            let parts = url.split('/');
            let filters = parts.pop().split(',');

            let new_filters = [];

            $.each(filters, function (k, v) {
                if (v.substr(0, 2) != 'p_') {
                    new_filters.push(v);
                }
            });

            new_filters.push('p_min-' + price_min);
            new_filters.push('p_max-' + price_max);
            parts.push(new_filters.join(','));
            location = parts.join('/');

        } else if (url.substr(url.length - 2, 1) === '/' && $.isNumeric(url.substr(url.length - 1, 1))) {
            location = url + '/p_min-' + price_min + ',p_max-' + price_max;
        } else {
            location = url + ',p_min-' + price_min + ',p_max-' + price_max;
        }

        if (typeof word === 'undefined' && word !== '') {
            window.location.href = location;
        } else {
            window.location.href = location + '?word=' + word;
        }

        return false;
    });

    function moveDescription() {
        moveElement(
            $('.js-category-description'),
            768,
            $('.js-category-description-desktop-holder'),
            $('.js-category-description-mobile-holder')
        )
        moveElement(
            $('.js-manufacturer-description'),
            768,
            $('.js-manufacturer-description-desktop-holder'),
            $('.js-manufacturer-description-mobile-holder')
        )
    }

    moveDescription();

    window.addEventListener('resize', function () {

        moveDescription();

    });

    if (($('.c-product-box--list-b2b').length > 0 && $('.js-variant-table-container').length > 0) || $('.c-product-box--list-b2b-simple-variant').length) {

        let refreshTimeout = false;

        (function initTable () {

            $('.js-product-box').each(function() {
                const parent = $(this).find('.js-variant-table-container');
                const wrapper = $(this).find('.js-variant-table-wrapper');
                const singleElement = parent.find('.js-variant-row');
                const button = $(this).find('.js-show-all-variants');
                const buttonHeight = button.height();
                const wrapperHeight = wrapper.height();
                const singleElementHeight = singleElement.height() + 1;
                const otherElementsHeight = 40;

                if (singleElement.length <= 8) {
                    parent.css('max-height','unset');
                } else {
                    parent.css('max-height', singleElementHeight * 6 + otherElementsHeight + buttonHeight);
                    let parentHeight = parent.height();
                    button.addClass('is-visible')

                    button.on('click', function() {

                        if (button.hasClass('is-open')) {
                            parent.animate({
                                'max-height': parentHeight
                            },300, function() {
                                button.text(button.attr('data-first-title'));
                            })
                        } else {
                            parent.animate({
                                'max-height': wrapperHeight + buttonHeight + otherElementsHeight
                            },300, function() {
                                button.text(button.attr('data-second-title'));
                            })
                        }

                        button.toggleClass('is-open')
                    })
                }
            })
        })()

        function refreshPrices(element) {
            const parent = element.parents('.js-product-box');
            const pricesBox = parent.find('.js-product-prices');

            if (refreshTimeout) {
                clearTimeout(refreshTimeout);
            }
            pricesBox.addClass('is-loading');

            refreshTimeout = setTimeout(function() {
                calculateVariantsPrice(element);
                parent.find('.js-add-product-variants-to-card').removeClass('u-hide');
                parent.find('.js-add-product-to-card-success').addClass('u-hide');
                pricesBox.removeClass('is-loading');
                refreshTimeout = false;
            },1000);
        }

        $(document).on('input change', '.js-variant-quantity', function () {
            const element = $(this);
            refreshPrices(element);
        });

        $(document).on('click', '.js-variant-row .js-quantity-more, .js-variant-row .js-quantity-less', function () {
            const element = $(this);
            refreshPrices(element);
        });

        $(document).on('click', '.js-quantity-mobile-item', function () {
            const element = $('.js-variant-quantity[data-synchronize="'+ $(this).attr('data-synchronize') +'"]');
            refreshPrices(element);
        });

        $(document).on('submit', '.js-quantity-mobile-form', function () {
            const element = $('.js-variant-quantity[data-synchronize="'+ $(this).find('input').attr('data-synchronize') +'"]');
            refreshPrices(element);
        });

        function calculateVariantsPrice(element) {
            let product = element.parents('.js-product-box');


                let sum_netto = 0;
                let sum_brutto = 0;
                let sum_netto_original = 0;
                let sum_brutto_original = 0;

                product.find('.js-variant-row').each(function () {
                    let quantity = $(this).find('.js-variant-quantity').val();

                    let price_netto = priceToNumber($(this).find('.js-variant-price-netto').text());
                    sum_netto += price_netto * quantity;
                    sum_netto_original += price_netto * quantity;

                    if($(this).find('.js-variant-price-netto-old').length) {
                        let price_netto_old = priceToNumber($(this).find('.js-variant-price-netto-old').text());
                        sum_netto_original -= price_netto * quantity;
                        sum_netto_original += price_netto_old * quantity;
                    }

                    let price_brutto = priceToNumber($(this).find('.js-variant-price-brutto').text());
                    sum_brutto += price_brutto * quantity;
                    sum_brutto_original += price_brutto * quantity;

                    if($(this).find('.js-variant-price-brutto-old').length) {
                        let price_brutto_old = priceToNumber($(this).find('.js-variant-price-brutto-old').text());
                        sum_brutto_original -= price_brutto * quantity;
                        sum_brutto_original += price_brutto_old * quantity;
                    }
                })

                product.find('.js-product-price-value-net').text(numberToPrice(sum_netto));
                product.find('.js-product-price-value').text(numberToPrice(sum_brutto));

                if(sum_netto_original > sum_netto) {
                    product.find('.js-product-price-value-old-net').text(numberToPrice(sum_netto_original));
                    product.find('.c-product-box__price--old').removeClass('u-hide');
                } else {
                    product.find('.js-product-price-value-old-net').text('');
                    product.find('.c-product-box__price--old').addClass('u-hide');
                }

                if(sum_brutto_original > sum_brutto) {
                    product.find('.js-product-price-value-old').text(numberToPrice(sum_brutto_original));
                    product.find('.c-product-box__price--old').removeClass('u-hide');
                } else {
                    product.find('.js-product-price-value-old').text('');
                    product.find('.c-product-box__price--old').addClass('u-hide');
                }

        }

        console.log('test');

        $(document).on('click','.js-add-product-variants-to-card', function() {

            console.log('click');

            const button = $(this);
            const productID = button.attr('data-product-id');
            const product_box = button.parents('.js-product-box');
            const requiredOptions = button.attr('data-product-options') === 'link';
            const productUrl = button.attr('data-product-url');
            const table = product_box.find('.js-variant-table-container');
            const items = [];
            let productsSelected = false;

            if (requiredOptions) {
                window.location.href = productUrl;
                return false;
            }

            $('.js-variant-row').removeClass('is-error-quantity');

            button.addClass('is-loading');

            product_box.find('.js-variant-row').each(function() {
                const quantity = $(this).find('.js-variant-quantity').val();
                const variantID = $(this).attr('data-id');

                if (quantity > 0) {
                    productsSelected = true;

                    const item = {
                        product_id: productID,
                        quantity: quantity,
                        variant: variantID,
                        options: null
                    }

                    items.push(item);
                }
            })

            if(!productsSelected) {
                alert(product_box.find('.js-variant-table-wrapper').attr('data-alert0'));
                button.removeClass('is-loading')
            }

            if (items.length) {

                table.addClass('is-loading');

                addItemsToCart(items, button, function(data) {
                    product_box.find('.js-variant-quantity').val(0);

                    if (data.status === 'ok') {
                        product_box.find('.js-product-price-value-netto-old').text('');
                        product_box.find('.js-product-price-value-brutto-old').text('');
                        product_box.find('.js-product-price-value-netto').text('0,00');
                        product_box.find('.js-product-price-value-brutto').text('0,00');
                    }

                    if (data.status === "error") {

                        data.errors.forEach(error => {
                            let variantRow = product_box.find(`.js-variant-row[data-id='${error.variant_id}']`);
                            variantRow.find('.js-variant-quantity').val(error.quantity)
                            variantRow.addClass('is-error-quantity');
                        })

                        refreshPrices(button)
                        alert(product_box.find('.js-variant-table-wrapper').attr('data-alert1'));
                    }

                    button.removeClass('is-loading');
                    table.removeClass('is-loading');
                })
            }
        })
    }

})