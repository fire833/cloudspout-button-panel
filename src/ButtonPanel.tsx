import React, { PureComponent } from 'react';
import { Button, IconName, ButtonVariant } from '@grafana/ui';
import { PanelProps } from '@grafana/data';
import { getTemplateSrv } from '@grafana/runtime';
import { ButtonPanelOptions, ButtonPanelState } from 'types';

interface Props extends PanelProps<ButtonPanelOptions> {}

export class ButtonPanel extends PureComponent<Props, ButtonPanelState> {
  constructor(props: any) {
    super(props);
    this.state = {
      api_call: 'READY',
      response: '',
      // responseData: new Response,
    };
  }

  resetState() {
    this.setState({
      api_call: 'READY',
      response: '',
    });
  }

  apiStateIcon(): IconName | undefined {
    switch (this.state.api_call) {
      case 'IN_PROGRESS':
        return 'fa fa-spinner';
      case 'SUCCESS':
        return 'check';
      case 'ERROR':
        return 'exclamation-triangle';
      case 'READY':
      default:
        return this.props.options.icon;
    }
  }

  apiStateClassName() {
    switch (this.state.api_call) {
      case 'IN_PROGRESS':
        return 'spinning';
      default:
        return '';
    }
  }

  getOrientation() {
    if (!this.props.options.orientation) {
      return 'center';
    }
    switch (this.props.options.orientation) {
      case 'left':
        return 'left';
      case 'right':
        return 'right';
      case 'center':
      default:
        return 'center';
    }
  }

  customStyle() {
    if (this.props.options.variant === 'custom') {
      return {
        // Reset Grafana defaults
        background: 'none',
        border: 'none',
        // Set custom styles
        backgroundColor: this.props.options.backgroundColor,
        color: this.props.options.foregroundColor,
      };
    } else {
      return {};
    }
  }

  variant(): ButtonVariant | undefined {
    if (this.props.options.variant === 'custom') {
      return undefined;
    } else {
      return this.props.options.variant as ButtonVariant;
    }
  }

  buttonText() {
    return this.interpolateVariables(this.props.options.text);
  }

  interpolateVariables(text: string) {
    return getTemplateSrv().replace(text, this.props.data.request?.scopedVars);
  }

  prepareFetchOpts(url: URL): RequestInit {
    const { options } = this.props;

    const requestHeaders: HeadersInit = new Headers();
    requestHeaders.set('Accept', 'application/json');

    let fetchOpts: RequestInit = {
      method: options.method, // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      headers: requestHeaders,
      redirect: 'follow', // manual, *follow, error
      //referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    };

    if (options.method === 'POST') {
      requestHeaders.set('Content-Type', options.contentType);
      if (options.payload) {
        fetchOpts.body = this.interpolateVariables(options.payload);
      }
    }

    if (options.isAuth) {
      fetchOpts.credentials = 'include';
      requestHeaders.set('Authorization', 'Basic ' + btoa(options.username + ':' + options.password));
    }

    if (options.askForAuth) {
      // Get APIKey/password from user and set as the specified header.
      var pass = prompt("Enter API Key/Token you want to use to authenticate with remote API.", "");
      if (pass != null) {
        requestHeaders.set(options.apiKeyHeader, pass)
        pass == null; // Reset the password to get rid of it from memory.
      }
    }

    if (options.params) {
      if (options.type === 'header') {
        options.params.forEach((e) => {
          requestHeaders.set(this.interpolateVariables(e[0]), this.interpolateVariables(e[1]));
        });
      } else if (options.type === 'query') {
        options.params.forEach((e) => {
          url.searchParams.append(this.interpolateVariables(e[0]), this.interpolateVariables(e[1]));
        });
      } else {
        console.error('Unknown params type', options.type);
      }
    }

    return fetchOpts;
  }

  returnRespBox() {
    // Inject API response elements to be mutated over time
    return (
      <div className="panel-content">
        <div className="returnContent" id={this.props.options.text + "-returnContent"}>
          <h4 className="returnMsg" id={this.props.options.text + "-returnMsg"}> </h4>
        </div>
        <table className="returnHeaders" id={this.props.options.text + "-returnHeaders"}> </table>
        <p className="returnBody" id={this.props.options.text + "-returnBody"}> </p>
      </div>
    );
  }

  renderResponse(response: Response) {
    // this.injectHeaders(response.headers);

    var retBody = document.getElementById(this.props.options.text + "-returnBody");

    var RetContent = document.getElementById(this.props.options.text + "-returnContent");
    if (response.ok) {
      RetContent?.style.setProperty("background-color", "green");
      RetContent?.style.setProperty("border", "1px groove lightgreen");
      retBody?.style.setProperty("border", "1px inset darkseagreen");
    } else if (!response.ok) {
      RetContent?.style.setProperty("background-color", "red");
      RetContent?.style.setProperty("border", "1px groove lightsalmon");
      retBody?.style.setProperty("border", "1px inset darkred")
    }

    // var retStatus = document.getElementById(this.props.options.text + "-returnStatus");
    // if (retStatus != null) {
    //   retStatus.innerText = "Code: " + response.status.toString();
    // } else {
    //   console.log("Response status element not found.");
    // }

    var retMsg = document.getElementById(this.props.options.text + "-returnMsg");
    if (retMsg != null) {
      retMsg.innerText = "Code: " + response.status.toString() + " Message: " + response.statusText;
      retMsg.style.setProperty("align-content", "center");
      // console.log("Updated status code.");
    } else {
      console.log("Response message element not found.");
    }

    response.text().then((data) => {
      if (retBody != null) {
        retBody.innerText = data;
        // console.log("Updated response text.");
      } else {
        console.log("Response body element not found.");
      }
    });

    
  }

  injectHeaders(parent: Headers) {
      parent.forEach(function(value: String, key: String, parent: Headers) {
        let headers = document.getElementById("returnHeaders");
        if (headers != null) {
          let row = headers.getElementsByTagName("tbody")[0].insertRow();
          let k = row.insertCell(0);
          let v = row.insertCell(1);
          k.innerText == key;
          v.innerText == value;

          headers?.appendChild(k);
          headers?.appendChild(v);

          parent.set("", "");
        }
      })

      console.log("Added headers to response.")

  }

  render() {
    const { options } = this.props;

    const execute = () => {
      this.setState({ api_call: 'IN_PROGRESS' });

      const url = new URL(this.interpolateVariables(options.url));
      console.log(options.method, ' to ', url, ' with params as ', options.type);

      let fetchOpts = this.prepareFetchOpts(url);

      fetch(url.toString(), fetchOpts)
        .then((response) => {

          if (response.type === 'opaque') {
            // CORS prevents us from knowing what's up - so be it
            this.setState({
              api_call: 'READY',
              response: 'CORS prevents access to the response',
            });
          } else if (response.ok) {
            
            this.setState({
              api_call: 'SUCCESS',
              response: response.statusText,
              // responseData: response
            });
            console.log('Request successful: ', response);
            if (options.printResponse) {
              this.renderResponse(response);
            }

          } else {
            console.log('Request failed: ', response);
            if (options.printResponse) {
              this.renderResponse(response);
            }

            throw new Error(response.status + response.statusText);
          }
        })
        .catch((e) => {
          this.setState({
            api_call: 'ERROR',
            response: e.message,
            // responseData: new Response()
          });

          let elem = document.getElementById("returnText");
          elem?.innerText == "Error: " + e.Message;

          console.error('Request error: ', e);
        })
        .finally(() => {
          setTimeout(this.resetState.bind(this), 2500);
        });
    };

    return (
      <div className={this.getOrientation()}>
        <Button
          variant={this.variant()}
          title={this.state.response}
          size="lg"
          className={this.apiStateClassName()}
          icon={this.apiStateIcon()}
          onClick={execute}
          style={this.customStyle()}
        >
          {this.buttonText()}
        </Button>
        {this.returnRespBox()}
      </div>
    );
  }
}
