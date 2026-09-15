$(function () {

    let refreshOptionsTimeout = false;
    let variantImagesRequest = false;
    let originalGalleryImages = [];

    const DEFAULT_VARIANT_IMAGE_SIZE = 'thumb_xlarge';
    const isNewProductGalleryEnabled = $('.js-gallery-variant-enabled').length > 0;

    if (isNewProductGalleryEnabled) {
        cacheOriginalGalleryImages();
    }

    $(document).on('click', '.js-image-option', function () {
        let id = $(this).attr('data-id');

        if ($(this).hasClass('js-select-product-option-multiple')) {
            $(this).toggleClass('is-selected');

            let id = $(this).attr('data-id');

            $(this)
                .parents('.js-option-select')
                .find(`.js-selected-option-selector[data-id=${id}]`)
                .toggleClass('is-disabled');
        } else {
            $(this)
                .parents('.js-image-option-wrapper')
                .find('.js-image-option')
                .removeClass('is-selected');

            $(this).addClass('is-selected');

            let name = $(this).find('.js-image-option-title').text();
            let price = $(this).find('.js-image-option-price').text();
            let image = $(this).find('.js-image-option-image').attr('src');

            if (price.length > 0) {
                $(this)
                    .parents('.js-option-select')
                    .find('.js-option-select-name')
                    .text(name + ' (' + price + ')');
            } else {
                $(this)
                    .parents('.js-option-select')
                    .find('.js-option-select-name')
                    .text(name);
            }

            $(this)
                .parents('.js-option-select')
                .find('.js-option-select-icon')
                .attr('src', image);
        }

        $(this)
            .parents('.js-option-select')
            .find('.js-option-select-label')
            .addClass('is-active');

        if (!$(this).hasClass('js-select-product-option-multiple')) {
            $(this)
                .parents('.js-option-select')
                .find('.js-close-modal-aside')
                .trigger('click');

            $(this)
                .parents('.js-option-select')
                .find('.js-selected-option-selector')
                .addClass('is-disabled');

            $(this)
                .parents('.js-option-select')
                .find(`.js-selected-option-selector[data-id=${id}]`)
                .removeClass('is-disabled');

            $(this)
                .parents('.js-option-select')
                .find('.js-option-select-label')
                .addClass('is-active');
        }
    });

    $(document).on('click', '.js-image-option-clear', function () {
        $(this)
            .parents('.l-modal-aside')
            .find('.js-image-option')
            .removeClass('is-selected');

        $(this)
            .parents('.js-option-select')
            .find('.js-option-select-label')
            .removeClass('is-active');

        $(this)
            .parents('.js-option-select')
            .find('.js-selected-option-selector')
            .addClass('is-disabled');

        $(this)
            .parents('.js-option-select')
            .find('.js-close-modal-aside')
            .trigger('click');
    });

    // OPTION SELECT

    $(document).on('click', '.js-select-product-option', function () {
        let element = $(this);

        setTimeout(function () {
            if (element.attr('data-action') === 'clear') {
                element
                    .parents('.js-option-select')
                    .find('.js-selected-option')
                    .val('none');
            } else {
                if (element.hasClass('js-select-product-option-multiple')) {
                    let optionValues = [];

                    element
                        .parent()
                        .find('.js-select-product-option.is-selected')
                        .each(function () {
                            optionValues.push($(this).attr('data-id'));
                        });

                    let optionsString = optionValues.join(',');

                    element
                        .parents('.js-option-select')
                        .find('.js-selected-option')
                        .val(optionsString);
                } else {
                    element
                        .parents('.js-option-select')
                        .find('.js-selected-option')
                        .val(element.attr('data-id'));
                }

                if (element.parents('.js-option-select').attr('data-required') === 'required') {
                    element
                        .parents('.js-option-select')
                        .find('.js-select-product-option-error')
                        .addClass('is-deactivated');
                }
            }

            if (!$('.js-option-select .js-select-product-option.is-selected').length) {
                $('.js-option-select .js-select-product-option[data-action!="clear"]').removeClass('u-hide');
            }

            if (element.parents('.js-option-select').find('.js-select-product-option.is-selected').length) {
                element
                    .parents('.js-option-select')
                    .find('.js-select-product-option[data-action="clear"]')
                    .removeClass('u-hide');
            } else {
                element
                    .parents('.js-option-select')
                    .find('.js-select-product-option[data-action="clear"]')
                    .addClass('u-hide');
            }

            let options = [];

            element.closest('.js-product-card-purchase-scope').find('.js-selected-option').each(function () {
                if ($(this).val().includes(',')) {
                    let optionsValues = $(this).val().split(',');

                    optionsValues.forEach(value => options.push(value));
                } else {
                    options.push($(this).val());
                }
            });

            $('.js-add-product-to-wishlist.js-product-card-wishlist-button').attr('data-product-options', options);

            let scope = element.parents('.js-variants-scope');

            if (!$('.js-variant-table-container').length) {
                if (refreshOptionsTimeout) {
                    clearTimeout(refreshOptionsTimeout);
                }

                refreshOptionsTimeout = setTimeout(function () {
                    refresh_pricebox(scope);
                    refreshOptionsTimeout = false;
                }, 1000);
            } else {
                if (!element.hasClass('is-pricebox-reset')) {
                    $('.js-variant-table-container').addClass('is-loading');
                    $('.js-product-prices-sum').addClass('is-loading');

                    const productID = $('.js-product-card').attr('data-id');
                    const variantsQuantityArray = [];

                    $('.js-variant-row').each(function () {
                        const variantID = $(this).attr('data-id');
                        const variantQuantity = $(this).find('.js-variant-quantity').val();
                        const variantData = {
                            id: variantID,
                            quantity: variantQuantity
                        };

                        variantsQuantityArray.push(variantData);
                    });

                    $.post(base + theme_config.routes.product.get_product_data, {
                        product_id: productID,
                        options: options
                    }, function () {}, 'json')
                        .done(function (data) {
                            const table = $('.js-variant-table-container');

                            table.html(data.view).removeClass('is-loading');

                            variantsQuantityArray.forEach(variant => {
                                $(`.js-variant-row[data-id='${variant.id}']`)
                                    .find('.js-variant-quantity')
                                    .val(variant.quantity);
                            });

                            calculateVariantsPrice(table);
                            $('.js-product-prices-sum').removeClass('is-loading');
                        });
                } else {
                    element.removeClass('is-pricebox-reset');
                }
            }
        }, 100);
    });

    // VARIANT SELECT

    $(document).on('click', '.js-select-product-variant', function () {
        let element = $(this);
        let scope = element.parents('.js-variants-scope');

        setTimeout(function () {
            let variantID = element.parents('.js-variant-select').attr('data-rel');
            let variantSelectors = element.parents('.js-variants-scope').find('.js-variant-select');

            if (element.attr('data-action') === 'clear') {
                element
                    .parents('.js-variant-select')
                    .find('.js-selected-variant')
                    .val('none');

                $('.js-product-card-cart-button, .js-product-card-wishlist-button').attr('data-product-variants', 'tbd');
                $('.js-product-card-wishlist-button').parent().removeClass('is-active');
            } else {
                element
                    .parents('.js-variant-select')
                    .find('.js-selected-variant')
                    .val(element.attr('data-id'));

                element
                    .parents('.js-variant-select')
                    .find('.js-select-product-variant-only-error')
                    .addClass('is-deactivated');
            }

            if (!$('.js-variant-select .js-select-product-variant.is-selected').length) {
                $('.js-variant-select .js-select-product-variant[data-action!="clear"]').removeClass('u-hide');
            }

            variantSelectors.each(function () {
                let common = [];
                let current = $(this).attr('data-rel');

                if ($(this).find('.js-select-product-variant.is-selected').length) {
                    $(this)
                        .find('.js-select-product-variant[data-action="clear"]')
                        .removeClass('u-hide');
                } else {
                    $(this)
                        .find('.js-select-product-variant[data-action="clear"]')
                        .addClass('u-hide');
                }

                scope.find('.js-variant-select:not([data-rel=' + current + ']) .js-select-product-variant.is-selected').each(function () {
                    if (common.length) {
                        common = $(this)
                            .attr('data-rel')
                            .toString()
                            .split(',')
                            .filter(value => common.includes(value));
                    } else {
                        common = $(this)
                            .attr('data-rel')
                            .toString()
                            .split(',');
                    }
                });

                if ($(common).length) {
                    $(this).find('.js-select-product-variant[data-action!="clear"]').each(function () {
                        if (
                            $(this)
                                .attr('data-rel')
                                .toString()
                                .split(',')
                                .filter(value => common.includes(value))
                                .length
                        ) {
                            $(this).removeClass('u-hide');
                        } else {
                            $(this).addClass('u-hide');
                        }
                    });
                } else {
                    $(this).find('.js-select-product-variant[data-action!="clear"]').each(function () {
                        $(this).removeClass('u-hide');
                    });
                }

                if (variantID !== current) {
                    updateSelect($(this));
                }
            });

            if (variantSelectors.length === scope.find('.js-select-product-variant.is-selected').length) {
                refresh_pricebox(scope);
            }

            let variants_selected = getSelectedVariantPropertiesIds(scope);

            if (isNewProductGalleryEnabled) {
                refreshVariantImages(scope, variants_selected);
            } else {
                reload_images(variants_selected);
            }
        });
    });

    function refresh_pricebox(scope = $('.js-variants-scope').first()) {
        let common = [];
        let productId = $('.js-product-data').attr('data-product-id');

        scope.find('.js-variant-select .js-select-product-variant.is-selected').each(function () {
            if (common.length) {
                common = $(this)
                    .attr('data-rel')
                    .toString()
                    .split(',')
                    .filter(value => common.includes(value));
            } else {
                common = $(this)
                    .attr('data-rel')
                    .toString()
                    .split(',');
            }
        });

        let options = [];

        if (scope.find('.js-selected-option').length) {
            scope.find('.js-selected-option').each(function () {
                if ($(this).val().includes(',')) {
                    let optionsValues = $(this).val().split(',');

                    optionsValues.forEach(value => options.push(value));
                } else {
                    options.push($(this).val());
                }
            });
        }

        $('.js-product-card-cart-button, .js-product-card-wishlist-button').attr('data-product-variants', common[0]);

        $('.js-pricebox').addClass('is-loading');

        $.post(base + theme_config.routes.product.get_product_data, {
            product_id: productId,
            variant_id: common[0],
            options: options
        }, function () {}, 'json')
            .done(function (data) {
                $('.js-pricebox').html(data.view).removeClass('is-loading');

                if (data.ean) {
                    $('.js-product-ean').text(data.ean);
                }

                if (data.presale_date) {
                    let element = $('.js-product-data-presale');
                    let presale_date = Date.parse(data.presale_date);
                    let current_date = new Date();

                    if (presale_date > current_date) {
                        $('.js-product-data-presale-value').text(data.presale_date);
                        element.addClass('is-active');
                    } else {
                        element.removeClass('is-active');
                    }
                }

                if (data.availability_text) {
                    $('.js-product-availability-text').text(data.availability_text);
                }

                if (data.quantity_value && data.quantity_value > 0) {
                    $('.js-product-warehouse-quantity-value').text(data.quantity_value);
                    $('.js-product-warehouse-quantity').removeClass('u-hide');
                } else {
                    $('.js-product-warehouse-quantity').addClass('u-hide');
                }

                if (data.catalog) {
                    $('.js-product-catalog-number').text(data.catalog);
                }

                let buttons = $('.js-product-card-buttons');

                if (!data.quantity) {
                    buttons.find('.js-add-product-to-card, .js-add-product-to-card-success').addClass('u-hide');
                    buttons.find('.js-add-product-to-card-error').removeClass('u-hide');
                    $('.js-product-available[data-available="available"]').addClass('u-hide');
                    $('.js-product-available[data-available="not-available"]').removeClass('u-hide');
                } else {
                    buttons.find('.js-add-product-to-card').removeClass('u-hide');
                    buttons.find('.js-add-product-to-card-error, .js-add-product-to-card-success').addClass('u-hide');
                    $('.js-product-available[data-available="not-available"]').addClass('u-hide');
                    $('.js-product-available[data-available="available"]').removeClass('u-hide');
                }

                if ($('#aside-availability-form').length) {
                    $('.js-availability-form-variant-id').val(common[0]);
                }
            });
    }

    function refreshVariantImages(scope, variants) {
        if (!isNewProductGalleryEnabled) {
            reload_images(variants);
            return;
        }

        let productId = $('.js-product-data').attr('data-product-id');
        let variantId = getSelectedVariantId(scope);
        let variantPropertiesIds = getSelectedVariantPropertiesIds(scope);
        let imageSize = getVariantImageSize();

        if (!productId || !variantPropertiesIds.length) {
            restoreOriginalGalleryImages();

            if ($('.m-product-gallery-4').length) {
                $('.m-product-gallery-4 .js-image-container')
                    .removeClass('u-hide')
                    .addClass('is-active');

                refreshGalleryPlugins();

                return;
            }

            $('.js-dynamic-variant-image').removeClass('u-hide');

            refreshGalleryPlugins(0);

            if (typeof updateProductGallery === 'function') {
                updateProductGallery([]);
            }

            return;
        }

        if (!theme_config.routes.product.get_variant_images) {
            restoreOriginalGalleryImages();
            reload_images(variants);
            return;
        }

        if (variantImagesRequest) {
            variantImagesRequest.abort();
        }

        getGalleryLoadingElements().addClass('is-loading');

        variantImagesRequest = $.ajax({
            url: base + theme_config.routes.product.get_variant_images,
            method: 'POST',
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            data: JSON.stringify({
                product_id: productId,
                variant_id: variantId,
                variant_properties_ids: variantPropertiesIds,
                image_size: imageSize
            })
        })
            .done(function (data) {
                let images = normalizeVariantImagesResponse(data);

                if (images.length) {
                    updateGalleryImages(images);
                    return;
                }

                restoreOriginalGalleryImages();
                reload_images(variants);
            })
            .fail(function (xhr, status) {
                if (status === 'abort') {
                    return;
                }

                restoreOriginalGalleryImages();
                reload_images(variants);
            })
            .always(function () {
                getGalleryLoadingElements().removeClass('is-loading');
                variantImagesRequest = false;
                clearVisibleGalleryPreloaders();
            });
    }

    function getVariantImageSize() {
        let imageSize = $('.js-product-main-slider').attr('data-variant-image-size');

        if (imageSize) {
            return imageSize;
        }

        return DEFAULT_VARIANT_IMAGE_SIZE;
    }

    function getMainGallerySlides() {
        if ($('.m-product-gallery-4').length) {
            return $('.m-product-gallery-4 .js-image-container');
        }

        if ($('.m-product-gallery-2').length) {
            return $('.m-product-gallery-2 .js-main-slide');
        }

        return $('.js-main-slide');
    }

    function getAsideGallerySlides() {
        if ($('.m-product-gallery-4').length) {
            return $();
        }

        if ($('.m-product-gallery-2').length) {
            return $('.m-product-gallery-2 .js-aside-slide');
        }

        return $('.js-aside-slide');
    }

    function getGalleryLoadingElements() {
        if ($('.m-product-gallery-4').length) {
            return $('.m-product-gallery-4__images');
        }

        return $('.js-product-main-slider, .js-product-aside-slider');
    }

    function getVariantImageUrl(url) {
        if (!url) {
            return '';
        }

        if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0) {
            return url;
        }

        if (url.indexOf('/') === 0) {
            return window.location.origin + url;
        }

        return window.location.origin + '/' + url;
    }

    function getSelectedVariantId(scope) {
        let common = [];

        scope.find('.js-selected-variant').each(function () {
            let propertyId = $(this).val();

            if (!propertyId || propertyId === 'none') {
                return;
            }

            let rel = $(this)
                .closest('.js-variant-select')
                .find('.js-select-product-variant[data-id="' + propertyId + '"]')
                .attr('data-rel');

            if (!rel) {
                return;
            }

            if (common.length) {
                common = rel
                    .toString()
                    .split(',')
                    .filter(value => common.includes(value));
            } else {
                common = rel
                    .toString()
                    .split(',');
            }
        });

        return common.length ? common[0] : null;
    }

    function getSelectedVariantPropertiesIds(scope) {
        let variantPropertiesIds = [];

        scope.find('.js-selected-variant').each(function () {
            let propertyId = $(this).val();

            if (propertyId && propertyId !== 'none') {
                variantPropertiesIds.push(propertyId);
            }
        });

        return variantPropertiesIds;
    }

    function normalizeVariantImagesResponse(data) {
        if (!data) {
            return [];
        }

        if ($.isArray(data)) {
            return normalizeVariantImages(data);
        }

        if (data.status && data.status !== 'ok') {
            return [];
        }

        if ($.isArray(data.images)) {
            return normalizeVariantImages(data.images);
        }

        return [];
    }

    function normalizeVariantImages(images) {
        let normalizedImages = [];

        images.forEach(function (image) {
            let normalizedImage = normalizeVariantImage(image);

            if (normalizedImage.url) {
                normalizedImages.push(normalizedImage);
            }
        });

        return normalizedImages;
    }

    function normalizeVariantImage(image) {
        if (typeof image === 'string') {
            return {
                url: getVariantImageUrl(image),
                alt: '',
                title: ''
            };
        }

        if (!image) {
            return {
                url: '',
                alt: '',
                title: ''
            };
        }

        let imageUrl = image.url || image.src || '';

        return {
            url: getVariantImageUrl(imageUrl),
            alt: image.alt || '',
            title: image.title || image.alt || ''
        };
    }

    function cacheOriginalGalleryImages() {
        originalGalleryImages = [];

        getMainGallerySlides().each(function (index) {
            let mainSlide = $(this);
            let asideSlide = getAsideGallerySlides().eq(index);

            let mainImage = mainSlide.find('img').first();
            let asideImage = asideSlide.find('img').first();

            originalGalleryImages.push({
                main: {
                    src: mainImage.attr('src') || '',
                    dataSrc: mainImage.attr('data-src') || '',
                    originalSrc: mainImage.attr('data-original-src') || '',
                    alt: mainImage.attr('alt') || '',
                    title: mainImage.attr('title') || ''
                },
                aside: {
                    src: asideImage.attr('src') || '',
                    dataSrc: asideImage.attr('data-src') || '',
                    alt: asideImage.attr('alt') || '',
                    title: asideImage.attr('title') || ''
                },
                mainVariants: mainSlide.attr('data-variants') || '',
                asideVariants: asideSlide.attr('data-variants') || ''
            });
        });
    }

    function restoreOriginalGalleryImages() {
        if (!originalGalleryImages.length) {
            return;
        }

        getMainGallerySlides().each(function (index) {
            let originalImage = originalGalleryImages[index];

            if (!originalImage) {
                return;
            }

            let mainSlide = $(this);
            let mainImage = mainSlide.find('img').first();

            if (mainImage.length) {
                let mainSrc = originalImage.main.src || originalImage.main.dataSrc;

                if (mainSrc) {
                    mainImage.attr('src', mainSrc);
                } else {
                    mainImage.removeAttr('src');
                }

                mainImage.attr('data-src', originalImage.main.dataSrc || mainSrc);
                mainImage.attr('data-original-src', originalImage.main.originalSrc || mainSrc);
                mainImage.attr('alt', originalImage.main.alt);
                mainImage.attr('title', originalImage.main.title);
            }

            mainSlide
                .attr('data-variants', originalImage.mainVariants)
                .removeClass('u-hide')
                .addClass('is-active');

            markSlideImageAsLoaded(mainSlide);
        });

        getAsideGallerySlides().each(function (index) {
            let originalImage = originalGalleryImages[index];

            if (!originalImage) {
                return;
            }

            let asideSlide = $(this);
            let asideImage = asideSlide.find('img').first();

            if (asideImage.length) {
                let asideSrc = originalImage.aside.src || originalImage.aside.dataSrc;

                if (asideSrc) {
                    asideImage.attr('src', asideSrc);
                } else {
                    asideImage.removeAttr('src');
                }

                asideImage.attr('data-src', originalImage.aside.dataSrc || asideSrc);
                asideImage.attr('alt', originalImage.aside.alt);
                asideImage.attr('title', originalImage.aside.title);
            }

            asideSlide.attr('data-variants', originalImage.asideVariants);

            markSlideImageAsLoaded(asideSlide);
        });
    }

    function updateGalleryImages(images) {
        let mainSlides = getMainGallerySlides();
        let asideSlides = getAsideGallerySlides();

        restoreOriginalGalleryImages();

        if ($('.m-product-gallery-4').length) {
            mainSlides
                .addClass('u-hide')
                .removeClass('is-active');

            images.forEach(function (image, index) {
                let mainSlide = mainSlides.eq(index);

                if (mainSlide.length) {
                    updateMainGallerySlide(mainSlide, image);

                    mainSlide
                        .attr('data-variants', 'dynamic')
                        .removeClass('u-hide')
                        .addClass('is-active');
                }
            });

            if (!images.length) {
                mainSlides
                    .removeClass('u-hide')
                    .addClass('is-active');
            }

            refreshGalleryPlugins();

            return;
        }

        mainSlides.addClass('u-hide');
        asideSlides.addClass('u-hide');

        images.forEach(function (image, index) {
            let mainSlide = mainSlides.eq(index);
            let asideSlide = asideSlides.eq(index);

            if (mainSlide.length) {
                updateMainGallerySlide(mainSlide, image);

                mainSlide
                    .attr('data-variants', 'dynamic')
                    .removeClass('u-hide');
            }

            if (asideSlide.length) {
                updateAsideGallerySlide(asideSlide, image);

                asideSlide
                    .attr('data-variants', 'dynamic')
                    .removeClass('u-hide');
            }
        });

        refreshGalleryPlugins(0);

        if (typeof updateProductGallery === 'function') {
            updateProductGallery();
        }
    }

    function updateMainGallerySlide(slide, image) {
        let img = slide.find('img').first();

        if (!img.length) {
            return;
        }

        img.attr('src', image.url);
        img.attr('data-src', image.url);
        img.attr('data-original-src', image.url);
        img.attr('alt', image.alt || '');
        img.attr('title', image.title || image.alt || '');

        markSlideImageAsLoaded(slide);
    }

    function updateAsideGallerySlide(slide, image) {
        let img = slide.find('img').first();

        if (!img.length) {
            return;
        }

        img.attr('src', image.url);
        img.attr('data-src', image.url);
        img.attr('alt', image.alt || '');
        img.attr('title', image.title || image.alt || '');

        img.removeAttr('srcset');
        img.removeAttr('data-srcset');
        img.removeAttr('sizes');

        markSlideImageAsLoaded(slide);
    }

    function markSlideImageAsLoaded(slide) {
        let img = slide.find('img').first();

        if (img.length) {
            let imageSrc = img.attr('src') || img.attr('data-src');

            if (imageSrc) {
                img.attr('src', imageSrc);
                img.attr('data-src', img.attr('data-src') || imageSrc);
            }

            img
                .removeClass('lazy swiper-lazy swiper-lazy-loading')
                .addClass('swiper-lazy-loaded is-loaded');
        }

        slide.find('.swiper-lazy-preloader').remove();
    }

    function clearVisibleGalleryPreloaders() {
        getMainGallerySlides()
            .not('.u-hide')
            .each(function () {
                markSlideImageAsLoaded($(this));
            });

        getAsideGallerySlides()
            .not('.u-hide')
            .each(function () {
                markSlideImageAsLoaded($(this));
            });

        $('.js-image-container')
            .not('.u-hide')
            .each(function () {
                markSlideImageAsLoaded($(this));
            });
    }

    function refreshGalleryPlugins(slideIndex) {
        clearVisibleGalleryPreloaders();

        if (typeof productAsideSlider !== 'undefined' && productAsideSlider) {
            if (typeof productAsideSlider.update === 'function') {
                productAsideSlider.update();
            }

            if (
                productAsideSlider.lazy &&
                typeof productAsideSlider.lazy.load === 'function'
            ) {
                productAsideSlider.lazy.load();
            }

            if (
                typeof slideIndex !== 'undefined' &&
                typeof productAsideSlider.slideTo === 'function'
            ) {
                productAsideSlider.slideTo(slideIndex);
            }
        }

        if (typeof productMainSlider !== 'undefined' && productMainSlider) {
            if (typeof productMainSlider.update === 'function') {
                productMainSlider.update();
            }

            if (
                productMainSlider.lazy &&
                typeof productMainSlider.lazy.load === 'function'
            ) {
                productMainSlider.lazy.load();
            }

            if (
                typeof slideIndex !== 'undefined' &&
                typeof productMainSlider.slideTo === 'function'
            ) {
                productMainSlider.slideTo(slideIndex);
            }
        }

        clearVisibleGalleryPreloaders();

        if (
            typeof mainGallery !== 'undefined' &&
            mainGallery &&
            typeof updateMainGallery === 'function'
        ) {
            updateMainGallery();
        }
    }

    function reload_images(variants) {
        let all_slides = $('.js-dynamic-variant-image');
        let variants_selected = [];

        if (variants) {
            variants_selected = variants;
        } else {
            $('.js-select-product-variant.is-selected').each(function () {
                let variant_id = $(this).attr('data-id');

                variants_selected.push(variant_id);
            });
        }

        let images_found = false;

        all_slides.each(function () {
            let image_variants = $(this).attr('data-variants');

            if (image_variants && image_variants !== 'none') {
                image_variants = image_variants.split(';');

                if (variants_selected.length) {
                    if (variants_selected.every(elem => image_variants.indexOf(elem) > -1)) {
                        $(this).removeClass('u-hide');
                        images_found = true;
                    } else {
                        $(this).addClass('u-hide');
                    }
                }
            } else if (image_variants === 'none') {
                // zostawiamy bez zmian
            } else {
                $(this).addClass('u-hide');
            }
        });

        if (!images_found) {
            all_slides.removeClass('u-hide');
        }

        clearVisibleGalleryPreloaders();
        refreshGalleryPlugins();

        if (typeof updateProductGallery === 'function') {
            updateProductGallery(variants);
        }
    }

    // PRODUCT POPUP

    $(document).on('click', '.js-show-product-popup', function () {
        let id = $(this).attr('data-id');
        let name = $(this).text();
        let modal = $('#product-popup');

        modal.find('.js-product-popup-content').addClass('u-hide');
        modal.find('.l-modal-aside__title').text(name);
        modal.find('.js-product-popup-content[data-id=' + id + ']').removeClass('u-hide');

        openModalAside(modal);
    });

    if ($('.js-product-data-presale').length) {
        let element = $('.js-product-data-presale');
        let presale_date = Date.parse(element.attr('data-time'));
        let current_date = new Date();

        if (presale_date > current_date) {
            element.addClass('is-active');
        }
    }

    if ($('#aside-availability-form').length) {
        $('.js-availability-form-product-id').val($('.js-product-data').attr('data-product-id'));
    }

    function checkProductRedirect() {
        let product_card_url = new URL(location.href);
        let product_card_url_params = new URLSearchParams(product_card_url.search);

        if (product_card_url_params.has('variant_required')) {
            $('.js-product-card-cart-button').trigger('click');
            product_card_url.searchParams.delete('variant_required', 'true');
            window.history.replaceState(null, null, product_card_url.href);
        }
    }

    checkProductRedirect();

// FACEBOOK PIXEL VIEWCONTENT

    if (typeof fbq !== 'undefined') {
        const productCard = $('.js-product-card').first();
        const productContentId = productCard.attr('data-id');
        const viewContentEventId = productCard.attr(
            'data-facebook-view-content-event-id'
        );

        const viewContentData = {
            content_type: 'product',
            content_ids: [productContentId]
        };

        if (viewContentEventId) {
            fbq(
                'track',
                'ViewContent',
                viewContentData,
                {
                    eventID: viewContentEventId
                }
            );
        } else {
            fbq('track', 'ViewContent', viewContentData);
        }
    }

});
