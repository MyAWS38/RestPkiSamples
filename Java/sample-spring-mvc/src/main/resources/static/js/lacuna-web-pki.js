// -------------------- Add-on placeholder (IE only) --------------------
var lacunaWebPKIExtensionBeta = null;

// -------------------- Class declaration --------------------

/**
 * This class is used to communicate with the Web PKI component. Although the component is different for each browser (in Chrome it consists of both an extension and an application installed on the user's machine, on
 * Internet Explorer it is only an add-on), all interfacing with the component is done through this class regardless of the user's browser. The gory details of browser-dependant code are hidden by this class.
 *
 * Notice: make sure you call the {{#crossLink "LacunaWebPKI/init:method"}}{{/crossLink}} method before you call other methods.
 *
 * @class LacunaWebPKI
 * @constructor
 * @param [license] {String|Object} The license for the component. May be a string or an object (see examples). In order for the component to work, you must set a valid purchased license that matches the URL of the
 *                                  site running the code. The exception is when running the code from localhost. In that case, no license is needed, so you can test the component as much as you want in
 *                                  development before deciding to license it.
 *
 * @example
	// Here, we use the JSON format of our license. If you don't mind having the details of your license (expiration
	// date and allowed domains) in the source code of your page, this option is preferred because it makes it
	// easier to diagnose problems such as an expired license.
	var pki = new LacunaWebPKI( {
		"format": 1,
		"allowedDomains": [
			"webpki.lacunasoftware.com",
			"jsfiddle.net"
		],
		"expiration": null,
		"signature": "ClKvO1J22vAD+YmfANiKQLbcLE1lNraPKCel6tRM+ZxR+h6M/crtJYRRVGGz7hrdbM0Y0mfTu15RMYGqQMi1QNZS6GrT4vNzIayv552Fl0EFWQA7jWlctUwfYoHRHVEnCNx9YGXDiA9+yDoGlVwgTR7fjzNeS3Fen1MVIyKBF464gN0JvdiCRJMI47JGVDkPmKjcrYIvJs6y5Lg25RW4ZnBKVruS+HR2s3k8ZrV4y4RCQE4UYMKbukF9vsF+JqAEifRlPq2xLcrNdxBveVDSXS/LRHAcrZrMM+Iw4A79jl0ngWPcy+CwinAhT+3dxVo5ZWMRQFpmTkylEMDvTjV9wQ=="
	});
 * @example
	// Here, we use the binary format of our license. This is preferred if you want to hide the details of your license
	// (expiration date and allowed domains). Please note that the details are not encrypted, just encoded in Base64.
	var pki = new LacunaWebPKI('ASYAanNmaWRkbGUubmV0LHdlYnBraS5sYWN1bmFzb2Z0d2FyZS5jb20AAAABClKvO1J22vAD+YmfANiKQLbcLE1lNraPKCel6tRM+ZxR+h6M/crtJYRRVGGz7hrdbM0Y0mfTu15RMYGqQMi1QNZS6GrT4vNzIayv552Fl0EFWQA7jWlctUwfYoHRHVEnCNx9YGXDiA9+yDoGlVwgTR7fjzNeS3Fen1MVIyKBF464gN0JvdiCRJMI47JGVDkPmKjcrYIvJs6y5Lg25RW4ZnBKVruS+HR2s3k8ZrV4y4RCQE4UYMKbukF9vsF+JqAEifRlPq2xLcrNdxBveVDSXS/LRHAcrZrMM+Iw4A79jl0ngWPcy+CwinAhT+3dxVo5ZWMRQFpmTkylEMDvTjV9wQ==');
 */
LacunaWebPKI = function (license) {
	this.license = null;
	this.defaultErrorCallback = null;
	this.angularScope = null;
	this.brand = null;
	this.restPkiUrl = null;
	if (license) {
		this.license = license;
	}
};

// Inject class prototype

(function ($) {

	// -------------------- Promise subclass --------------------

	/**
	 * An object that represents a promise to be fulfilled, through which the programmer can register callbacks for when the promise is fulfilled successfully or
	 * for when an error occurrs. All asyncronous methods from the LacunaWebPKI class return an instance of this object.
	 *
	 * For instance, the method {{#crossLink "LacunaWebPKI/listCertificates:method"}}{{/crossLink}}
	 * returns a promise which is fulfilled when the list of certificates is finally available. You could register a callback for when that happens, and another
	 * one for if an error occurs, in the following manner:
	 *
	pki.listCertificates()
	.success(function(certs) {
		// Every success callback receives a single argument. Its type (either string, array or object) and meaning depend on the method that returned the promise.
		$scope.certificates = certs;
	})
	.error(function (message, error, origin) {
		// Every error callback receives 3 arguments:
		// - message: a user-friendly message describing the error that occurred
		// - error: a detailed string containing as much information about the error as possible, for instance the stack trace. This is a good value to be logged, not to be shown to the user.
		// - origin: a string denoting where the error originated. This should also not be shown to the user, but rather logged for diagnostic purposes.
		alert('pki error from ' + origin + ': ' + message);
		if (window.console) {
			window.console.log('pki error', error);
		}
	});
	 *
	 * The success callback argument's type and meaning depend on the method that returns the promise. Please refer to each method's documentation for such information.
	 *
	 * NOTICE: You should not instantiate this object directly.
	 *
	 * @class Promise
	 * @for Promise
	 * @constructor
	 */
	$.Promise = function (angularScope) {
		this.successCallback = function() { };
		this.errorCallback = function () { };
		this.angularScope = angularScope;
	};

	/**
	 * Registers a callback to be called when the operation is completed successfully. The callback receives a single argument representing the operation's result.
	 *
	 * The type of the argument (either string, array or object) and its meaning depend on the method that returns the promise. Please refer to each method's documentation
	 * for such information.
	 *
	 * @method success
	 * @chainable
	 *
	 * @param callback {function} A function to be called once the promise is fulfilled, receiving a single argument representing the operation's result.
	 *
	 * @example
	pki.listCertificates().success(function(certs) {
		$scope.certificates = certs;
	});
	 */
	$.Promise.prototype.success = function (callback) {
		this.successCallback = callback;
		return this;
	};

	/**
	 * Registers a callback to be called if an error occurs during the operation. The error callback signature is always the same, and so are the meaning of each argument, which are
	 * described in the example below.
	 *
	 * @method error
	 * @chainable
	 *
	 * @param callback {function} A function to be called if the an error occurs during the operation.
	 *
	 * @example
	pki.listCertificates()
	.success(onListCertificatesCompleted)
	.error(function (message, error, origin) {
		// The error callback always receives 3 arguments:
		// - message: a user-friendly message describing the error that occurred
		// - error: a detailed string containing as much information about the error as possible, for instance the stack trace. This is a good value to be logged, not to be shown to the user.
		// - origin: a string denoting where the error originated. This should also not be shown to the user, but rather logged for diagnostic purposes.
		alert('pki error from ' + origin + ': ' + message);
		if (window.console) {
			window.console.log('pki error', error);
		}
	});
	 */
	$.Promise.prototype.error = function (callback) {
		this.errorCallback = callback;
		return this;
	};

	$.Promise.prototype._invokeSuccess = function (result, delay) {
		if (delay > 0) {
			var self = this;
			setTimeout(function () {
				self._invokeSuccess(result);
			}, delay);
		} else {
			var callback = this.successCallback || function () { $._log('Success ignored (no callback registered)'); };
			this._apply(function () {
				callback(result);
			});
		}
	};

	$.Promise.prototype._invokeError = function (message, error, origin, delay) {
		if (delay > 0) {
			var self = this;
			setTimeout(function () {
				self._invokeError(message, error, origin);
			}, delay);
		} else {
			var callback = this.errorCallback || function (message, error, origin) {
				throw 'Web PKI error originated at ' + origin + ': ' + message + '\n' + error;
			};
			this._apply(function () {
				callback(message, error, origin);
			});
		}
	};

	// https://coderwall.com/p/ngisma/safe-apply-in-angular-js
	$.Promise.prototype._apply = function (callback) {
		if (this.angularScope) {
			var phase = this.angularScope.$root.$$phase;
			if (phase == '$apply' || phase == '$digest') {
				callback();
			} else {
				this.angularScope.$apply(function () {
					callback();
				});
			}
		} else {
			callback();
		}
	};


	// -------------------- Constants --------------------

	$._installUrl = 'https://getwebpkibeta.lacunasoftware.com/';
	$._chromeExtensionId = 'bilncomoicocegjjailledgehhanjgmc';
	$._chromeExtensionRequiredVersion = '2.0.22';
	$._chromeNativeWinRequiredVersion = '2.0.9';
	$._ieLatestAddonVersion = '1.6.1';
	$._chromeExtensionFirstVersionWithSelfUpdate = '2.0.20';

	$._chromeInstallationStates = {
		INSTALLED: 0,
		EXTENSION_NOT_INSTALLED: 1,
		EXTENSION_OUTDATED: 2,
		NATIVE_NOT_INSTALLED: 3,
		NATIVE_OUTDATED: 4
	};

	$.installationStates = {
		INSTALLED: 0,
		NOT_INSTALLED: 1,
		OUTDATED: 2,
		BROWSER_NOT_SUPPORTED: 3
	};

	// -------------------- "Private" static functions (no reference to 'this') --------------------

	$._compareVersions = function (v1, v2) {

		var v1parts = v1.split('.');
		var v2parts = v2.split('.');

		function isPositiveInteger(x) {
			return /^\d+$/.test(x);
		}

		function validateParts(parts) {
			for (var i = 0; i < parts.length; ++i) {
				if (!isPositiveInteger(parts[i])) {
					return false;
				}
			}
			return true;
		}

		if (!validateParts(v1parts) || !validateParts(v2parts)) {
			return NaN;
		}

		for (var i = 0; i < v1parts.length; ++i) {

			if (v2parts.length === i) {
				return 1;
			}

			var v1p = parseInt(v1parts[i]);
			var v2p = parseInt(v2parts[i]);

			if (v1p === v2p) {
				continue;
			}
			if (v1p > v2p) {
				return 1;
			}
			return -1;
		}

		if (v1parts.length != v2parts.length) {
			return -1;
		}

		return 0;
	};

	$._log = function (message) {
		if (window.console) {
			window.console.log(message);
		}
	};

	// -------------------- "Private" instance functions (with references to 'this') --------------------

	$._createContext = function (args) {
		var promise = new $.Promise(this.angularScope);
		if (args && args.success) {
			promise.success(args.success);
		}
		if (args && args.error) {
			promise.error(args.error);
		} else {
			promise.error(this.defaultErrorCallback);
		}
		var context = {
			promise: promise,
			license: this.license
		};
		return context;
	};

	// -------------------- Public functions --------------------

	/**
	 * Initializes the instance of the LacunaWebPKI object. This method must be called before calling any other methods.
	 *
	 * @method init
	 * @for LacunaWebPKI
	 *
	 * @param args {Object|String} An object with the options below. Alternatively, a function, which is interpreted as the parameter args.ready.
	 * @param args.ready {Function} A function to be called when the component is ready to be used. The function receives no arguments.
	 * @param [args.notInstalled] {Function} A function to be called if the component's installation is not OK (component not installed, outdated or user is using an unsupported browser).
	 *                                       Refer to examples below for the exact function signature. If no callback is given, the user is automatically redirected to the installation website and
	 *                                       will be redirected back once the installation is completed.
	 *                                       If you do pass a callback to override the default behavior, use the {{#crossLink "LacunaWebPKI/redirectToInstallPage:method"}}{{/crossLink}} method to
	 *                                       redirect the user to the installation page whenever you think it's convenient. 
	 * @param [args.defaultError] {Function} The default callback to be called when an error occurrs (please refer to examples below for the exact function signature).
	 * @param [args.angularScope] {Object}   If your webpage uses AngularJS, you can pass here a reference to your $scope, which will then be used to call the callback functions properly, relieving
	 *                                       you of doing a "$scope.$apply(function() { ... });" on every callback. The calls are actually wrapped around a "safe $apply", as described in
	 *                                       https://coderwall.com/p/ngisma/safe-apply-in-angular-js.
	 * @param [args.license] {Object|String} The license for the component, if not already set when instantiating the object.
	 * @return {Promise} A promise object that can be used to register a callback to be called when the operation completes. Specifically in the case of this method, it is recommended to pass callbacks
	 *                   on the function arguments (ready and notInstalled) rather than on the promise.
	 * @example
	// This is the simplest way to call the method, in case you don't wish to register a default error callback nor
	// define a custom behavior for when the component is not installed/outdated.
	pki.init(onWebPkiReady);

	// The ready callback receives no arguments
	function onWebPkiReady() {
		// start using the component
	}
	 * @example
	// If you wish to pass any other argument, you must use the extended version of the method:
	pki.init({
		ready: onWebPkiReady,
		notInstalled: onWebPkiNotInstalled,
		defaultError: onWebPkiError,
		angularScope: $scope
	});

	function onWebPkiReady() {
		// start using the component
	}

	// The notInstalled callback receives two parameters:
	// - status: A number indicating the reason for the failed verification, whose value is equal to one of the values of the
	//           LacunaWebPKI.installationStates object (NOT_INSTALLED: 1, OUTDATED: 2, BROWSER_NOT_SUPPORTED: 3)
	// - message: A user-friendly message describing the reason for the failure.
	function onWebPkiNotInstalled(status, message) {
		alert(message + '\n\nYou will be redirected to the installation page');
		pki.redirectToInstallPage();
	}

	// The default error callback receives 3 arguments:
	// - message: a user-friendly message describing the error that occurred
	// - error: a detailed string containing as much information about the error as possible, for instance the stack trace. This is a good value to be logged, not to be shown to the user.
	// - origin: a string denoting where the error originated. This should also not be shown to the user, but rather logged for diagnostic purposes.
	function onWebPkiError(message, error, origin) {
		alert(message);
		if (window.console) {
			window.console.log('Web PKI error from ' + origin + ': ' + error);
		}
	}
	* @exampleurl https://jsfiddle.net/LacunaSoftware/o1ogv0ya/embedded/
	* @exampleurl https://jsfiddle.net/LacunaSoftware/6zk6c91u/embedded/
	*/
	$.init = function (args) {

		if (!args) {
			args = {};
		} else if (typeof args === 'function') {
			args = {
				ready: args
			};
		}

		if (args.license) {
			this.license = args.license;
		}
		if (args.defaultError) {
			this.defaultErrorCallback = args.defaultError;
		}
		if (args.angularScope) {
			this.angularScope = args.angularScope;
		}
		if (args.brand) {
			this.brand = args.brand;
		}
		if (args.restPkiUrl) {
		    this.restPkiUrl = args.restPkiUrl;
		}

		var onCheckInstalledSuccess = function (result) {
			if (result.isInstalled) {
				if (args.ready) {
					args.ready();
				} else {
					$._log('Web PKI ready (no callback registered)');
				}
			} else {
				if (args.notInstalled) {
					args.notInstalled(result.status, result.message, result.browserSpecificStatus);
				} else {
					$.redirectToInstallPage();
				}
			}
		};

		var context = this._createContext({
			success: onCheckInstalledSuccess,
			error: args.error
		});
		$._requestHandler.checkInstalled(context);
		return context.promise;
	};

	/**
	 * Retrieves the installed component's version.
	 *
	 * @method getVersion
	 *
	 * @param [args] {Object} An object with the following options:
	 * @param [args.success] {Function} A function to be called when the operation is completed successfully, receiving a string with the retrieved version.
	 * @param [args.error] {Function} A function to be called if an error occurrs during the operation.
	 * @return {Promise} A promise object that can be used to register a callback to be called when the operation completes. The success callback for this promise receives a string with the retrieved version.
	 *
	 * @example
	pki.getVersion().success(function (version) {
		// The success callback receives a string containing the installed component version
		log('Version: ' + version);
	});
	 * @exampleurl https://jsfiddle.net/LacunaSoftware/zt5L1Lex/embedded/
	 */
	$.getVersion = function (args) {
		var context = this._createContext(args);
		$._requestHandler.sendCommand(context, 'getVersion', null);
		return context.promise;
	};

	/**
	 * Lists the available certificates.
	 *
	 * @method listCertificates
	 *
	 * @param [args] {Object}
	 * @param [args.success] {Function} A function to be called when the operation is completed successfully, receiving an array with the retrieved certificates (please refer to examples for the properties in each item of the array).
	 * @param [args.error] {Function} A function to be called if an error occurrs during the operation.
	 * @return {Promise} A promise object that can be used to register a callback to be called when the operation completes. The success callback for this promise receives an array with the retrieved
	 *                   certificates (please refer to examples for the properties in each item of the array).
	 *
	 * @example
	pki.listCertificates().success(function (certs) {
		var select = $("#certificateSelect");
		$.each(certs, function() {
			// The certs parameter, passed to the success callback, is an array whose each element has the following properties:
			// - thumbprint (used to reference the certificate in the other methods such as readCertificate and signData)
			// - subjectName (the CommonName portion of the subject's name)
			// - issuerName (the CommonName portion of the issuer's name)
			select.append($("<option />").val(this.thumbprint).text(this.subjectName + ' (issued by ' + this.issuerName + ')'));
		});
	});
	 * @example
	pki.listCertificates({
		success: function (certs) {
			var select = $("#certificateSelect");
			$.each(certs, function() {
				select.append($("<option />").val(this.thumbprint).text(this.subjectName + ' (issued by ' + this.issuerName + ')'));
			});
		}
	});
	 * @exampleurl https://jsfiddle.net/LacunaSoftware/1Lu3k2sw/embedded/
	 * @exampleurl https://jsfiddle.net/LacunaSoftware/gf387erq/embedded/
	 */
	$.listCertificates = function (args) {

		if (!args) {
			args = {};
		} else if (args.filter) {
			if (typeof args.filter !== 'function') {
				if (typeof args.filter === 'boolean') {
					throw 'args.filter must be a function (hint: if you used "pki.filters.xxx()", try removing the "()")';
				} else {
					throw 'args.filter must be a function, received ' + (typeof args.filter);
				}
			}
		}

		var context = this._createContext(args);
		$._requestHandler.sendCommand(context, 'listCertificates', null, function (result) {
			return $._processCertificates(result, args.filter);
		});

		return context.promise;
	};

	$._processCertificates = function (result, filter) {
		var toReturn = [];
		for (var i = 0; i < result.length; i++) {
			var cert = result[i];
			cert.validityStart = new Date(cert.validityStart);
			cert.validityEnd = new Date(cert.validityEnd);
			if (cert.pkiBrazil && cert.pkiBrazil.dateOfBirth) {
				var s = cert.pkiBrazil.dateOfBirth;
				cert.pkiBrazil.dateOfBirth = new Date(parseInt(s.slice(0, 4)), parseInt(s.slice(5, 7)) - 1, parseInt(s.slice(8, 10)));
			}
			if (filter) {
				if (filter(cert)) {
					toReturn.push(cert);
				}
			} else {
				toReturn.push(cert);
			}
		}
		return toReturn;
	};

	$.filters = {
		isPkiBrazilPessoaFisica: function (cert) {
			if (typeof cert == 'undefined') {
				throw 'filter called without cert argument (hint: if you are using "pki.filters.isPkiBrazilPessoaFisica()", try "pki.filters.isPkiBrazilPessoaFisica")';
			}
			return (cert.pkiBrazil && (cert.pkiBrazil.cpf || '') !== '' && (cert.pkiBrazil.cnpj || '') === '');
		},
		hasPkiBrazilCpf: function (cert) {
			if (typeof cert == 'undefined') {
				throw 'filter called without cert argument (hint: if you are using "pki.filters.hasPkiBrazilCpf()", try "pki.filters.hasPkiBrazilCpf")';
			}
			return (cert.pkiBrazil && (cert.pkiBrazil.cpf || '') !== '');
		},
		hasPkiBrazilCnpj: function (cert) {
			if (typeof cert == 'undefined') {
				throw 'filter called without cert argument (hint: if you are using "pki.filters.hasPkiBrazilCnpj()", try "pki.filters.hasPkiBrazilCnpj")';
			}
			return (cert.pkiBrazil && (cert.pkiBrazil.cnpj || '') !== '');
		},
		pkiBrazilCpfEquals: function (cpf) {
			if (typeof cpf !== 'string') {
				throw 'cpf must be a string (hint: if you are using "pki.filters.pkiBrazilCpfEquals", try "pki.filters.pkiBrazilCpfEquals(' + "'" + 'somecpf' + "'" + ')")';
			}
			return function (cert) {
				return (cert.pkiBrazil && cert.pkiBrazil.cpf === cpf);
			};
		},
		pkiBrazilCnpjEquals: function (cnpj) {
			if (typeof cnpj !== 'string') {
				throw 'cnpj must be a string (hint: if you are using "pki.filters.pkiBrazilCnpjEquals", try "pki.filters.pkiBrazilCnpjEquals(' + "'" + 'somecnpj' + "'" +')")';
			}
			return function (cert) {
				return (cert.pkiBrazil && cert.pkiBrazil.cnpj === cnpj);
			};
		},
		hasPkiItalyCodiceFiscale: function (cert) {
			if (typeof cert == 'undefined') {
				throw 'filter called without cert argument (hint: if you are using "pki.filters.hasPkiItalyCodiceFiscale()", try "pki.filters.hasPkiItalyCodiceFiscale")';
			}
			return (cert.pkiItaly && (cert.pkiItaly.codiceFiscale || '') !== '');
		},
		pkiItalyCodiceFiscaleEquals: function (cf) {
			if (typeof cf !== 'string') {
				throw 'cf must be a string (hint: if you are using "pki.filters.pkiItalyCodiceFiscaleEquals", try "pki.filters.pkiItalyCodiceFiscaleEquals(' + "'" + 'someCodice' + "'" + ')")';
			}
			return function (cert) {
				return (cert.pkiItaly && cert.pkiItaly.codiceFiscale === cf);
			};
		},
		isWithinValidity: function (cert) {
			if (typeof cert == 'undefined') {
				throw 'filter called without cert argument (hint: if you are using "pki.filters.isWithinValidity()", try "pki.filters.isWithinValidity")';
			}
			var now = new Date();
			return (cert.validityStart <= now && now <= cert.validityEnd);
		},
		all: function () {
			var filters;
			if (arguments.length === 1 && typeof arguments[0] === 'object') {
				filters = arguments[0];
			} else {
				filters = arguments;
			}
			return function (cert) {
				for (var i = 0; i < filters.length; i++) {
					var filter = filters[i];
					if (!filter(cert)) {
						return false;
					}
				}
				return true;
			};
		},
		any: function () {
			var filters;
			if (arguments.length === 1 && typeof arguments[0] === 'object') {
				filters = arguments[0];
			} else {
				filters = arguments;
			}
			return function (cert) {
				for (var i = 0; i < filters.length; i++) {
					var filter = filters[i];
					if (filter(cert)) {
						return true;
					}
				}
				return false;
			};
		}
	};

	/**
	 * Reads a certificate's binary encoding.
	 *
	 * Most browser signature schemes that relay to the server-side code the responsibility of encoding the signature require that the signer certificate's binary encoding
	 * be read and sent back to the server for the generation of the "to-sign-bytes" or "signed attributes". This method enables your code to do that.
	 *
	 * @method readCertificate
	 *
	 * @param args {Object|String} An object with the options below. Alternatively, a string, which is interpreted as the parameter args.thumbprint.
	 * @param args.thumbprint {String} The certificate's thumbprint, as yielded by the method {{#crossLink "LacunaWebPKI/listCertificates:method"}}{{/crossLink}}.
	 * @param [args.success] {Function} A function to be called when the operation is completed successfully, receiving a string with the certificate's binary encoding in Base64
	 * @param [args.error] {Function} A function to be called if an error occurrs during the operation.
	 * @return {Promise} A promise object that can be used to register a callback to be called when the operation completes. The success callback for this promise receives
	 *                   a string containing the certificate's binary encoding in Base64.
	 *
	 * @example
	// Let's assume you're using jQuery and have populated the dropdown "certificateSelect" with the certificates returned
	// by the listCertificates method, putting on the value attribute of each option the certificate's thumbprint.
	var selectedCertThumbprint = $('#certificateSelect').val();
	// We use the certificate's thumbprint as previously returned by the listCertificates method
	// to read the certificate's encoding using the readCertificate method.
	pki.readCertificate({
		thumbprint: selectedCertThumbprint,
	}).success(function (certContent) {
		// The success callback receives a single argument containing the certificate's binary encoding in Base64
		alert('Certificate read: ' + certContent);
	});
	 * @example
	// Here, we'll use the shortcut version of the method, passing the certificate's thumbprint directly in the first argument of the method.
	pki.readCertificate(selectedCertThumbprint).success(function (certContent) {
		alert('Certificate read: ' + certContent);
	});
	 * @exampleurl https://jsfiddle.net/LacunaSoftware/L3rw4ohp/embedded/
	 */
	$.readCertificate = function (args) {

		if (typeof args === 'string') {
			args = {
				thumbprint: args
			};
		}

		var context = this._createContext(args);
		$._requestHandler.sendCommand(context, 'readCertificate', { certificateThumbprint: args.thumbprint });
		return context.promise;
	};

	$.pollNative = function (args) {
		if (!args) {
			args = {};
		}
		var context = this._createContext(args);
		var requiredNativeWinVersion = $._chromeNativeWinRequiredVersion;
		$._requestHandler.sendCommand(context, 'pollNative', { requiredNativeWinVersion: requiredNativeWinVersion });
		return context.promise;
	};

	/**
	 * Signs a pre-computed digest value with a certificate.
	 *
	 * @method signHash
	 *
	 * @param args {Object} An object with the following options:
	 * @param args.thumbprint {String} The thumbprint of the certificate to be used, as yielded by the method {{#crossLink "LacunaWebPKI/listCertificates:method"}}{{/crossLink}}.
	 * @param args.hash {String} The pre-computed digest value to be signed, encoded in Base64.
	 * @param args.digestAlgorithm {String} The name or OID of the digest algorithm used to compute the given digest value. Common values for this
	 *                                      parameter are 'SHA-256' or 'SHA-1'. The forms 'SHA256', 'sha256', 'sha 256', 'sha-256' will also work.
	 * @param [args.success] {Function} A function to be called when the operation is completed successfully, receiving a string with the signature algorithm's output encoded in Base64.
	 * @param [args.error] {Function} A function to be called if an error occurrs during the operation.
	 * @return {Promise} A promise object that can be used to register a callback to be called when the operation completes The success callback for this promise receives a string
	 *                   with the signature algorithm's output encoded in Base64.
	 *
	 * @example
	// Let's assume you're using jQuery and have populated the dropdown "certificateSelect" with the certificates returned
	// by the listCertificates method, putting on the value attribute of each option the certificate's thumbprint. Let's
	// also assume that you received from the server the digest to be signed and the digest algorithm used to compute
	// the digest.
	var selectedCertThumbprint = $('#certificateSelect').val();
	var hashToSign = '...'; // typically received from server
	var digestAlgorithm = '...'; // typically received from server
	pki.signHash({
		thumbprint: selectedCertThumbprint,
		hash: hashToSign,
		digestAlgorithm: digestAlgorithm
	}).success(function (signature) {
		// The success callback receives a single argument containing the signature output, encoded in Base64
		alert('Signature: ' + signature);
	});
	 * @exampleurl https://jsfiddle.net/LacunaSoftware/czdLb9ra/embedded/
	 */
	$.signHash = function (args) {
		var context = this._createContext(args);
		var request = {
			certificateThumbprint: args.thumbprint,
			hash: args.hash,
			digestAlgorithm: args.digestAlgorithm
		};
		$._requestHandler.sendCommand(context, 'signHash', request);
		return context.promise;
	};

	/**
	 * Signs a collection of bytes with a certificate.
	 *
	 * @method signData
	 *
	 * @param args {Object} An object with the following options:
	 * @param args.thumbprint {String} The thumbprint of the certificate to be used, as yielded by the method {{#crossLink "LacunaWebPKI/listCertificates:method"}}{{/crossLink}}.
	 * @param args.data {String} The bytes to be signed, encoded in Base64.
	 * @param args.digestAlgorithm {String} The name or OID of the digest algorithm to be used to compute the hash of the bytes during the signature operation. Common values for this
	 *                                      parameter are 'SHA-256' or 'SHA-1'. The forms 'SHA256', 'sha256', 'sha 256', 'sha-256' will also work.
	 * @param [args.success] {Function} A function to be called when the operation is completed successfully, receiving a string with the signature algorithm's output encoded in Base64.
	 * @param [args.error] {Function} A function to be called if an error occurrs during the operation.
	 * @return {Promise} A promise object that can be used to register a callback to be called when the operation completes The success callback for this promise receives a string
	 *                   with the signature algorithm's output encoded in Base64.
	 *
	 * @example
	// Let's assume you're using jQuery and have populated the dropdown "certificateSelect" with the certificates returned
	// by the listCertificates method, putting on the value attribute of each option the certificate's thumbprint. Let's
	// also assume that you received from the server the data to be signed and the digest algorithm to be used.
	var selectedCertThumbprint = $('#certificateSelect').val();
	var dataToSign = '...'; // typically received from server
	var digestAlgorithmOid = '...'; // typically received from server
	pki.signData({
		thumbprint: selectedCertThumbprint,
		data: dataToSign,
		digestAlgorithm: digestAlgorithm
	}).success(function (signature) {
		// The success callback receives a single argument containing the signature output, encoded in Base64
		alert('Signature: ' + signature);
	});
	 * @exampleurl https://jsfiddle.net/LacunaSoftware/718chbhb/embedded/
	 */
	$.signData = function (args) {
		var context = this._createContext(args);
		var request = {
			certificateThumbprint: args.thumbprint,
			data: args.data,
			digestAlgorithm: args.digestAlgorithm
		};
		$._requestHandler.sendCommand(context, 'signData', request);
		return context.promise;
	};

	$.signWithRestPki = function (args) {
	    var context = this._createContext(args);
	    var request = {
	        certificateThumbprint: args.thumbprint,
	        token: args.token,
            restPkiUrl: this.restPkiUrl
	    };
	    $._requestHandler.sendCommand(context, 'signWithRestPki', request);
	    return context.promise;
	};

	$.preauthorizeSignatures = function (args) {

		if (!args) {
			args = {};
		}

		var context = this._createContext(args);
		var request = {
			certificateThumbprint: args.certificateThumbprint,
			signatureCount: args.signatureCount
		};
		$._requestHandler.sendCommand(context, 'preauthorizeSignatures', request);
		return context.promise;
	};

	$.showFolderBrowser = function (args) {

		if (!args) {
			args = {};
		} else if (typeof args === 'string') {
			args = {
				message: args
			};
		}

		var context = this._createContext(args);
		var request = {
			message: args.message
		};
		$._requestHandler.sendCommand(context, 'showFolderBrowser', request);
		return context.promise;
	};

	$.downloadToFolder = function (args) {

		if (!args) {
			args = {};
		}

		var url = args.url || '';
		if (url.indexOf('://') < 0) {
			var a = document.createElement('a');
			a.href = url;
			url = a.href;
		}
	
		var context = this._createContext(args);
		var request = {
			url: url,
			folderId: args.folderId,
			filename: args.filename
		};
		$._requestHandler.sendCommand(context, 'downloadToFolder', request);
		return context.promise;
	};

	$.openFolder = function (args) {

		if (!args) {
			args = {};
		} else if (typeof args === 'string') {
			args = {
				folderId: args
			};
		}

		var context = this._createContext(args);
		$._requestHandler.sendCommand(context, 'openFolder', args.folderId);
		return context.promise;
	};

	/**
	 * Redirects the user to the install page, with the appropriate url arguments so as to make the user be redirected back to the original page once the
	 * installation completes successfully.
	 *
	 * @method redirectToInstallPage
	 *
	 * @exampleurl https://jsfiddle.net/LacunaSoftware/6zk6c91u/embedded/
	 */
	$.redirectToInstallPage = function () {
		var returnUrl = encodeURIComponent(document.URL);
		if (this.brand) {
			document.location.href = $._installUrl + this.brand + '?returnUrl=' + returnUrl;
		} else {
			document.location.href = $._installUrl + '?returnUrl=' + returnUrl;
		}
	};

	$.updateExtension = function (args) {
		if (!args) {
			args = {};
		}
		var context = this._createContext(args);
		$._requestHandler.sendCommand(context, 'updateExtension', null);
		return context.promise;
	};

	// -------------------- Browser detection --------------------
	// http://stackoverflow.com/questions/2400935/browser-detection-in-javascript
	$.detectedBrowser = (function () {
		var ua = navigator.userAgent, tem,
		M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
		if (/trident/i.test(M[1])) {
			tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
			return 'IE ' + (tem[1] || '');
		}
		if (M[1] === 'Chrome') {
			tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
			if (tem !== null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
		}
		M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
		if ((tem = ua.match(/version\/(\d+)/i)) !== null) M.splice(1, 1, tem[1]);
		return M.join(' ');
	})();

	// -------------------- Browser-dependent singleton --------------------

	if ($._requestHandler === undefined) {

		if ($.detectedBrowser.indexOf("Chrome") >= 0) {

			// --------------------------------------------------------------------------------------------------------------------------------
			// ---------------------------------------------------- CHROME REQUEST HANDLER ----------------------------------------------------
			// --------------------------------------------------------------------------------------------------------------------------------

			$._requestHandler = new function () {

				var requestEventName = 'com.lacunasoftware.WebPKIBeta.RequestEvent';
				var responseEventName = 'com.lacunasoftware.WebPKIBeta.ResponseEvent';
				var pendingRequests = {};

				var s4 = function () {
					return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
				};

				var generateGuid = function () {
					return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
				};

				var registerPromise = function (promise, responseProcessor) {
					var requestId = generateGuid();
					pendingRequests[requestId] = { promise: promise, responseProcessor: responseProcessor };
					return requestId;
				};

				var sendCommand = function (context, command, request, responseProcessor) {
					var requestId = registerPromise(context.promise, responseProcessor);
					var message = {
						requestId: requestId,
						license: context.license,
						command: command,
						request: request
					};
					var event = new CustomEvent('build', { 'detail': message });
					event.initEvent(requestEventName);
					document.dispatchEvent(event);
				};

				var checkInstalled = function (context) {
					setTimeout(function () { pollExtension(context, 25); }, 200); // 25 x 200 ms = 5 seconds until we give up
				};

				var pollExtension = function (context, tryCount) {
					$._log('polling extension');
					var div = document.getElementById($._chromeExtensionId);
					if (div === null) {
						if (tryCount > 1) {
							setTimeout(function () {
								pollExtension(context, tryCount - 1);
							}, 200);
						} else {
							context.promise._invokeSuccess({
								isInstalled: false,
								status: $.installationStates.NOT_INSTALLED,
								message: 'The Web PKI extension is not installed',
								browserSpecificStatus: $._chromeInstallationStates.EXTENSION_NOT_INSTALLED
							});
						}
						return;
					}
					checkExtensionVersion(context);
				};

				var checkExtensionVersion = function (context) {
					$._log('checking extension version');
					var subPromise = new $.Promise(null);
					subPromise.success(function (version) {
						if ($._compareVersions(version, $._chromeExtensionRequiredVersion) < 0) {
							var canSelfUpdate = ($._compareVersions(version, $._chromeExtensionFirstVersionWithSelfUpdate) >= 0);
							context.promise._invokeSuccess({
								isInstalled: false,
								status: $.installationStates.OUTDATED,
								browserSpecificStatus: $._chromeInstallationStates.EXTENSION_OUTDATED,
								message: 'The Web PKI extension is outdated (installed version: ' + version + ', required version: ' + $._chromeExtensionRequiredVersion + ')',
								chromeExtensionCanSelfUpdate: canSelfUpdate
							});
						} else {
							initializeExtension(context);
						}
					});
					subPromise.error(function (message, error, origin) {
						context.promise._invokeError(message, error, origin);
					});
					sendCommand({ license: context.license, promise: subPromise }, 'getExtensionVersion', null);
				};
				var initializeExtension = function (context) {
					$._log('initializing extension');
					var subPromise = new $.Promise(null);
					subPromise.success(function (response) {
						if (response.isReady) {
							if (response.nativeInfo.os !== 'Windows' || $._compareVersions(response.nativeInfo.installedVersion, $._chromeNativeWinRequiredVersion) >= 0) {
								context.promise._invokeSuccess({
									isInstalled: true
								});
							} else {
								context.promise._invokeSuccess({
									isInstalled: false,
									status: $.installationStates.OUTDATED,
									browserSpecificStatus: $._chromeInstallationStates.NATIVE_OUTDATED,
									message: 'The Web PKI native component is outdated (installed version: ' + response.nativeInfo.installedVersion + ', required version: ' + $._chromeNativeWinRequiredVersion + ')'
								});
							}
						} else {
							context.promise._invokeSuccess({
								isInstalled: false,
								status: convertInstallationStatus(response.status),
								browserSpecificStatus: response.status,
								message: response.message
							});
						}
					});
					subPromise.error(function (message, error, origin) {
						context.promise._invokeError(message, error, origin);
					});
					sendCommand({ license: context.license, promise: subPromise }, 'initialize', null);
				};

				var convertInstallationStatus = function (bss) {
					if (bss === $._chromeInstallationStates.INSTALLED) {
						return $.installationStates.INSTALLED;
					} else if (bss === $._chromeInstallationStates.EXTENSION_OUTDATED || bss === $._chromeInstallationStates.NATIVE_OUTDATED) {
						return $.installationStates.OUTDATED;
					} else {
						return $.installationStates.NOT_INSTALLED;
					}
				};

				var onResponseReceived = function (data) {
					var result = data.detail;
					var request = pendingRequests[result.requestId];
					delete pendingRequests[result.requestId];
					if (result.success) {
						if (request.responseProcessor) {
							result.response = request.responseProcessor(result.response);
						}
						request.promise._invokeSuccess(result.response);
					} else {
						request.promise._invokeError(result.exception.message, result.exception.complete, result.exception.origin);
					}
				};

				this.sendCommand = sendCommand;
				this.checkInstalled = checkInstalled;

				document.addEventListener(responseEventName, onResponseReceived);
			};

		} else if ($.detectedBrowser.indexOf('IE') >= 0) {

			// --------------------------------------------------------------------------------------------------------------------------------
			// ------------------------------------------------------ IE REQUEST HANDLER ------------------------------------------------------
			// --------------------------------------------------------------------------------------------------------------------------------

			$._requestHandler = new function () {

				var pendingRequests = {};
				var currentPollIndex = 0;

				var s4 = function () {
					return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
				};

				var generateGuid = function () {
					return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
				};

				var registerPromise = function (promise, responseProcessor) {
					var requestId = generateGuid();
					pendingRequests[requestId] = {
						promise: promise,
						pollStart: currentPollIndex,
						responseProcessor: responseProcessor
					};
					return requestId;
				};

				var getAddon = function() {
					return lacunaWebPKIExtensionBeta;
				};

				var poll = function () {

					if (getAddon()) {

						var resultsJson = getAddon().GetAvailableResults();
						if (resultsJson === null) {
							throw 'Add-on method GetAvailableResults failed'; // TODO
						}

						var results = JSON.parse(resultsJson);
						var requestIdsToRemove = [];
						for (var requestId in pendingRequests) {
							var pendingRequest = pendingRequests[requestId];
							var removePendingRequest = false;
							if (pendingRequest.sendFailed) {
								removePendingRequest = true;
							} else {
								var result = null;
								for (var i = 0; i < results.length; i++) {
									if (results[i].requestId == requestId) {
										result = results[i];
										break;
									}
								}
								if (result !== null) {
									if (result.success) {
										if (pendingRequest.responseProcessor) {
											result.response = pendingRequest.responseProcessor(result.response);
										}
										pendingRequest.promise._invokeSuccess(result.response);
									} else {
										pendingRequest.promise._invokeError(result.exception.message, result.exception.complete, result.exception.origin);
									}
									removePendingRequest = true;
								} else if (currentPollIndex >= pendingRequest.pollStart + 120) { // timeout: 120 x 500ms = 60 seconds
									pendingRequest.promise._invokeError('The operation has timed out', 'The operation has timed out', 'helper');
									removePendingRequest = true;
								}
							}
							if (removePendingRequest) {
								requestIdsToRemove.push(requestId);
							}
						}
						for (var j = 0; j < requestIdsToRemove.length; j++) {
							delete pendingRequests[requestIdsToRemove[j]];
						}

						currentPollIndex += 1;
					}

					setTimeout(poll, 500);
				};

				var checkExtension = function (context, tryCount) {
					$._log('checking extension');
					if (getAddon() === null) {
						if (tryCount > 1) {
							setTimeout(function () {
								checkExtension(context, tryCount - 1);
							}, 200);
						} else {
							context.promise._invokeSuccess({
								isInstalled: false,
								status: $.installationStates.NOT_INSTALLED,
								message: 'The Web PKI add-on is not installed'
							});
						}
						return;
					}
					var subPromise = new $.Promise(null);
					subPromise.success(function (version) {
						if ($._compareVersions(version, $._ieLatestAddonVersion) < 0) {
							context.promise._invokeSuccess({
								isInstalled: false,
								status: $.installationStates.OUTDATED,
								message: 'The Web PKI add-on is outdated (installed version: ' + version + ', latest version: ' + $._ieLatestAddonVersion + ')'
							});
						} else {
							context.promise._invokeSuccess({
								isInstalled: true
							});
						}
					});
					subPromise.error(function (message, error, origin) {
						context.promise._invokeError(message, error, origin);
					});
					sendCommand({ license: context.license, promise: subPromise }, 'getVersion', null);
				};

				var sendCommand = function (context, command, request, responseProcessor) {
					if (getAddon()) {
						var requestId = registerPromise(context.promise, responseProcessor);
						var message = {
							requestId: requestId,
							license: context.license,
							command: command,
							request: request
						};
						var sendCommandError;
						try {
							var success = getAddon().SendCommand(JSON.stringify(message));
							if (success === false) {
								sendCommandError = 'Failed to send command to add-on';
							}
						} catch (err) {
							sendCommandError = 'Exception when sending command to add-on: ' + err;
						}
						if (sendCommandError) {
							context.promise._invokeError('Failed to send command to add-on', sendCommandError, 'helper', 200);
							pendingRequests[requestId].sendFailed = true;
						}
					} else {
						context.promise._invokeError('Add-on not detected', 'Add-on not detected', 'helper', 200);
					}
				};

				var checkInstalled = function (context) {
					setTimeout(function () { checkExtension(context, 25); }, 200); // 25 x 200 ms = 5 seconds until we give up
				};

				this.sendCommand = sendCommand;
				this.checkInstalled = checkInstalled;
				poll();
			};

		} else {

			// --------------------------------------------------------------------------------------------------------------------------------
			// --------------------------------------------- UNSUPPORTED BROWSER REQUEST HANDLER ----------------------------------------------
			// --------------------------------------------------------------------------------------------------------------------------------

			$._requestHandler = new function () {

				var sendCommand = function (context, command, request, responseProcessor) {
					context.promise._invokeError('Browser not supported', 'Browser not supported', 'helper', 200);
				};

				var checkInstalled = function (context) {
					context.promise._invokeSuccess({
						isInstalled: false,
						status: $.installationStates.BROWSER_NOT_SUPPORTED,
						message: 'Your browser is not supported'
					}, 200);
				};

				this.sendCommand = sendCommand;
				this.checkInstalled = checkInstalled;
			};

		}

	}

})(LacunaWebPKI.prototype);
